import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const SAFE_HOSTS = ["kakaocdn.net", "daumcdn.net", "tistory.com"];

function isSafeUrl(url: string): boolean {
  return SAFE_HOSTS.some((host) => url.includes(host));
}

// Find a high-quality image from a safe host (kakao/daum)
async function findSafeImage(queries: string[]): Promise<string> {
  for (const q of queries) {
    try {
      const res = await fetch(
        `https://dapi.kakao.com/v2/search/image?query=${encodeURIComponent(q)}&size=15`,
        {
          cache: "no-store",
          headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
        }
      );
      const data = await res.json();
      // First pass: find large safe image
      for (const doc of data.documents || []) {
        if (isSafeUrl(doc.image_url) && doc.width >= 300) {
          return doc.image_url;
        }
      }
      // Second pass: any safe image
      for (const doc of data.documents || []) {
        if (isSafeUrl(doc.image_url)) {
          return doc.image_url;
        }
      }
      // Last resort: kakaocdn thumbnail (low res but works)
      for (const doc of data.documents || []) {
        if (doc.thumbnail_url && doc.thumbnail_url.includes("kakaocdn.net")) {
          return doc.thumbnail_url;
        }
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
    // Skip if already a safe high-res image (not 130x130 thumbnail)
    if (r.image_url && isSafeUrl(r.image_url) && !r.image_url.includes("130x130")) continue;

    const img = await findSafeImage([
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
    message: `${fixed}개 고화질로 교체, ${failed}개 실패`,
    fixed,
    failed,
    total: all.length,
  });
}
