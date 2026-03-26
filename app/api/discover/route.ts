import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

interface KakaoPlace {
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  place_url: string;
}

export async function GET(req: NextRequest) {
  const neighborhood = req.nextUrl.searchParams.get("neighborhood");
  const category = req.nextUrl.searchParams.get("category") || "술집";

  if (!neighborhood) {
    return NextResponse.json({ error: "neighborhood 파라미터가 필요합니다" }, { status: 400 });
  }

  if (!KAKAO_API_KEY) {
    return NextResponse.json({ error: "KAKAO_REST_API_KEY가 설정되지 않았습니다" }, { status: 500 });
  }

  try {
    const query = `${neighborhood} ${category}`;
    const encoded = encodeURIComponent(query);
    const kakaoRes = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encoded}&size=15`,
      {
        cache: "no-store",
        headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
      }
    );

    const kakaoData = await kakaoRes.json();
    const places: KakaoPlace[] = kakaoData.documents || [];

    if (places.length === 0) {
      return NextResponse.json({ message: "검색 결과가 없습니다", added: 0 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Check existing
    const { data: existing } = await supabase.from("restaurants").select("name, neighborhood");
    const existingSet = new Set(
      (existing || []).map((r: { name: string; neighborhood: string }) => `${r.name}__${r.neighborhood}`)
    );

    const newRestaurants = [];

    for (const place of places) {
      // Parse address
      const addrParts = place.address_name.split(" ");
      const region = addrParts[0] || "";
      const dong = addrParts[2] || addrParts[1] || neighborhood;

      const key = `${place.place_name}__${dong}`;
      if (existingSet.has(key)) continue;

      // Parse category (e.g. "음식점 > 술집 > 일본식주점")
      const catParts = place.category_name.split(" > ");
      const detailCategory = catParts[catParts.length - 1] || category;

      newRestaurants.push({
        name: place.place_name,
        region,
        neighborhood: dong,
        category: detailCategory,
        naver_map_url: null,
        instagram_url: null,
        status: "want_to_go",
        image_url: null,
        memo: `${category} · 자동 추가`,
      });
    }

    if (newRestaurants.length > 0) {
      const { error } = await supabase.from("restaurants").insert(newRestaurants);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: `${neighborhood} ${category} ${newRestaurants.length}개 추가`,
      added: newRestaurants.length,
      total_found: places.length,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
