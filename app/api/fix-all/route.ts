import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

async function searchImage(query: string): Promise<string> {
  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/search/image?query=${encodeURIComponent(query)}&size=3`,
      {
        cache: "no-store",
        headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
      }
    );
    const data = await res.json();
    const docs = data.documents || [];
    // Pick the largest image
    for (const doc of docs) {
      if (doc.image_url && doc.width > 200) return doc.image_url;
    }
    return docs[0]?.image_url || "";
  } catch {
    return "";
  }
}

// Check if image URL is actually loadable
async function isImageValid(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    const ct = res.headers.get("content-type") || "";
    return res.ok && ct.includes("image");
  } catch {
    return false;
  }
}

// Map 동 to 구
const dongToGu: Record<string, string> = {
  "합정동": "마포구", "서교동": "마포구", "망원동": "마포구", "연남동": "마포구",
  "상수동": "마포구", "도화동": "마포구", "산림동": "마포구",
  "성수동1가": "성동구", "성수동2가": "성동구", "성수동": "성동구",
  "논현동": "강남구", "삼성동": "강남구", "역삼동": "강남구", "대치동": "강남구",
  "신사동": "강남구", "압구정동": "강남구", "청담동": "강남구", "도곡동": "강남구",
  "서초동": "서초구", "잠실동": "송파구",
  "이태원동": "용산구", "한남동": "용산구", "보광동": "용산구",
  "종로1가": "종로구", "종로2가": "종로구", "명륜2가": "종로구", "명륜3가": "종로구",
  "관철동": "종로구", "계동": "종로구", "삼청동": "종로구", "사간동": "종로구",
  "소격동": "종로구", "안국동": "종로구", "세종로": "종로구", "돈의동": "종로구",
  "관수동": "종로구", "인사동": "종로구", "익선동": "종로구",
  "북창동": "중구", "신당동": "중구", "을지로동": "중구", "내자동": "중구",
  "대현동": "서대문구", "신촌동": "서대문구",
  "동숭동": "종로구",
  "구로동": "구로구",
  "당주동": "종로구",
  "여의도동": "영등포구",
  "광화문": "종로구",
};

function mapToGu(neighborhood: string, address?: string): string {
  // Already a 구
  if (neighborhood.endsWith("구")) return neighborhood;

  // Check map
  if (dongToGu[neighborhood]) return dongToGu[neighborhood];

  // Try partial match
  for (const [dong, gu] of Object.entries(dongToGu)) {
    if (neighborhood.includes(dong.replace("동", ""))) return gu;
  }

  return neighborhood;
}

export async function GET() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: all } = await supabase
    .from("restaurants")
    .select("id, name, neighborhood, category, image_url, instagram_url");

  if (!all) return NextResponse.json({ error: "DB 조회 실패" }, { status: 500 });

  let guFixed = 0;
  let thumbFixed = 0;
  let instaFixed = 0;

  for (const r of all) {
    const updates: Record<string, string> = {};

    // Fix neighborhood to 구
    const gu = mapToGu(r.neighborhood);
    if (gu !== r.neighborhood) {
      updates.neighborhood = gu;
      guFixed++;
    }

    // Fix missing or broken thumbnails
    if (!r.image_url) {
      let img = await searchImage(`${r.name} ${r.category} 음식`);
      if (!img) img = await searchImage(`${r.category} 맛집 음식 사진`);
      if (img) {
        updates.image_url = img;
        thumbFixed++;
      }
    }

    // Fix Instagram links
    if (!r.instagram_url) {
      const tag = r.name.replace(/\s+/g, "");
      updates.instagram_url = `https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`;
      instaFixed++;
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from("restaurants").update(updates).eq("id", r.id);
    }
  }

  return NextResponse.json({
    message: `동네→구 ${guFixed}개, 썸네일 ${thumbFixed}개, 인스타 ${instaFixed}개 수정`,
    gu_fixed: guFixed,
    thumb_fixed: thumbFixed,
    insta_fixed: instaFixed,
    total: all.length,
  });
}
