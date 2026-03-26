import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Use Kakao's own thumbnail URL (hosted on kakaocdn.net - never blocked)
async function findKakaoThumbnail(queries: string[]): Promise<string> {
  for (const q of queries) {
    try {
      const res = await fetch(
        `https://dapi.kakao.com/v2/search/image?query=${encodeURIComponent(q)}&size=5`,
        {
          cache: "no-store",
          headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
        }
      );
      const data = await res.json();
      for (const doc of data.documents || []) {
        // Use thumbnail_url (kakaocdn.net) instead of image_url (external)
        const url = doc.thumbnail_url || "";
        if (url && url.includes("kakaocdn.net")) return url;
      }
    } catch {
      continue;
    }
  }
  return "";
}

export async function GET() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: all } = await supabase.from("restaurants").select("id, name, neighborhood, category, image_url");
  if (!all) return NextResponse.json({ error: "DB error" }, { status: 500 });

  let fixed = 0;
  let failed = 0;

  for (const r of all) {
    // Fix ALL images - replace with kakaocdn thumbnails
    const isKakao = r.image_url && r.image_url.includes("kakaocdn.net");
    const isNaver = r.image_url && r.image_url.includes("pstatic.net");

    // Skip if already a working kakaocdn or naver image
    if (isKakao || isNaver) continue;

    const img = await findKakaoThumbnail([
      `${r.name} 음식`,
      `${r.name} ${r.neighborhood}`,
      `${r.name} 맛집`,
      `${r.neighborhood} ${r.category} 음식`,
      `${r.category} 음식 사진`,
    ]);

    if (img) {
      await supabase.from("restaurants").update({ image_url: img }).eq("id", r.id);
      fixed++;
    } else {
      failed++;
    }
  }

  return NextResponse.json({
    message: `${fixed}개 이미지 수정, ${failed}개 실패`,
    fixed,
    failed,
    total: all.length,
  });
}
