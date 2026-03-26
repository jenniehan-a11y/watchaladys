import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const NEIGHBORHOODS = [
  // 서울
  "합정", "성수", "연남", "이태원", "홍대", "망원", "을지로", "종로", "신촌",
  "강남", "압구정", "청담", "잠실", "여의도", "마포", "한남", "삼청동", "북촌",
  "연희동", "서촌", "익선동", "광화문", "신사", "논현", "역삼",
  // 경기
  "판교", "수원", "분당",
  // 부산
  "서면", "해운대", "광안리", "남포동", "전포",
  // 대구
  "동성로",
  // 제주
  "제주시", "서귀포", "애월", "함덕",
  // 대전
  "둔산동",
  // 광주
  "충장로",
];

const CATEGORIES = ["술집", "맛집", "카페"];

interface KakaoPlace {
  place_name: string;
  category_name: string;
  address_name: string;
  place_url: string;
}

// Fetch image using Kakao Image Search API
async function fetchImage(name: string, neighborhood: string): Promise<string> {
  try {
    const query = encodeURIComponent(`${name} ${neighborhood}`);
    const res = await fetch(
      `https://dapi.kakao.com/v2/search/image?query=${query}&size=1`,
      {
        cache: "no-store",
        headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
      }
    );
    const data = await res.json();
    const docs = data.documents || [];
    return docs[0]?.image_url || docs[0]?.thumbnail_url || "";
  } catch {
    return "";
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!KAKAO_API_KEY) {
    return NextResponse.json({ error: "KAKAO_REST_API_KEY 없음" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: existing } = await supabase.from("restaurants").select("name, neighborhood");
  const existingSet = new Set(
    (existing || []).map((r: { name: string; neighborhood: string }) => `${r.name}__${r.neighborhood}`)
  );

  let totalAdded = 0;
  const results: string[] = [];

  for (const hood of NEIGHBORHOODS) {
    for (const cat of CATEGORIES) {
      try {
        const query = encodeURIComponent(`${hood} ${cat}`);
        const res = await fetch(
          `https://dapi.kakao.com/v2/local/search/keyword.json?query=${query}&size=5`,
          {
            cache: "no-store",
            headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
          }
        );
        const data = await res.json();
        const places: KakaoPlace[] = data.documents || [];

        const newOnes = [];
        for (const p of places) {
          const addrParts = p.address_name.split(" ");
          const region = addrParts[0] || "";
          const dong = addrParts[2] || addrParts[1] || hood;

          const key = `${p.place_name}__${dong}`;
          if (existingSet.has(key)) continue;
          existingSet.add(key);

          const catParts = p.category_name.split(" > ");
          const detailCat = catParts[catParts.length - 1] || cat;

          // Get thumbnail from Kakao Image Search
          const imageUrl = await fetchImage(p.place_name, dong);

          newOnes.push({
            name: p.place_name,
            region,
            neighborhood: dong,
            category: detailCat,
            naver_map_url: null,
            instagram_url: null,
            status: "want_to_go" as const,
            image_url: imageUrl || null,
            memo: `${hood} ${cat} · 자동`,
          });
        }

        if (newOnes.length > 0) {
          await supabase.from("restaurants").insert(newOnes);
          totalAdded += newOnes.length;
          results.push(`${hood} ${cat}: +${newOnes.length}`);
        }
      } catch {
        // skip errors
      }
    }
  }

  return NextResponse.json({
    message: `전국 탐색 완료: ${totalAdded}개 추가`,
    added: totalAdded,
    details: results,
  });
}
