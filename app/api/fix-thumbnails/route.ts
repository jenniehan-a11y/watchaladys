import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function GET() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Get all restaurants without thumbnails
  const { data: noImage } = await supabase
    .from("restaurants")
    .select("id, name, neighborhood")
    .is("image_url", null);

  if (!noImage || noImage.length === 0) {
    return NextResponse.json({ message: "모든 맛집에 썸네일이 있습니다", fixed: 0 });
  }

  let fixed = 0;

  for (const r of noImage) {
    try {
      const query = encodeURIComponent(`${r.name} ${r.neighborhood} 맛집`);
      const res = await fetch(
        `https://dapi.kakao.com/v2/search/image?query=${query}&size=1`,
        {
          cache: "no-store",
          headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
        }
      );
      const data = await res.json();
      const docs = data.documents || [];
      const imageUrl = docs[0]?.image_url || docs[0]?.thumbnail_url || "";

      if (imageUrl) {
        await supabase
          .from("restaurants")
          .update({ image_url: imageUrl })
          .eq("id", r.id);
        fixed++;
      }
    } catch {
      // skip
    }
  }

  return NextResponse.json({
    message: `${fixed}/${noImage.length}개 썸네일 추가 완료`,
    fixed,
    total: noImage.length,
  });
}
