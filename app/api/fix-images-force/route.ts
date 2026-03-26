import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

async function findWorkingImage(queries: string[]): Promise<string> {
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
        const url = doc.image_url || "";
        if (!url) continue;
        // Verify image loads
        try {
          const check = await fetch(url, { method: "HEAD" });
          if (check.ok) return url;
        } catch {
          continue;
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
    // Check if current image works
    let needsFix = !r.image_url;
    if (r.image_url) {
      try {
        const check = await fetch(r.image_url, { method: "HEAD" });
        if (!check.ok) needsFix = true;
      } catch {
        needsFix = true;
      }
    }

    if (!needsFix) continue;

    // Search with multiple queries for best result
    const img = await findWorkingImage([
      `${r.name} 음식`,
      `${r.name} ${r.neighborhood}`,
      `${r.name} 맛집`,
      `${r.neighborhood} ${r.category} 맛집 음식`,
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
