import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function GET() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Step 1: Remove duplicates (keep the one with image, or the newest)
  const { data: all } = await supabase
    .from("restaurants")
    .select("id, name, neighborhood, image_url, created_at")
    .order("created_at", { ascending: false });

  if (!all) return NextResponse.json({ error: "DB 조회 실패" }, { status: 500 });

  const seen = new Map<string, string>();
  const toDelete: string[] = [];

  for (const r of all) {
    const key = `${r.name}__${r.neighborhood}`;
    if (seen.has(key)) {
      // Duplicate - delete the one without image, or the older one
      const existingId = seen.get(key)!;
      const existing = all.find((x) => x.id === existingId);
      if (!existing?.image_url && r.image_url) {
        // Current one has image, delete the existing one
        toDelete.push(existingId);
        seen.set(key, r.id);
      } else {
        toDelete.push(r.id);
      }
    } else {
      seen.set(key, r.id);
    }
  }

  let deleted = 0;
  for (const id of toDelete) {
    await supabase.from("restaurants").delete().eq("id", id);
    deleted++;
  }

  // Step 2: Fix thumbnails for remaining restaurants without images
  const { data: noImage } = await supabase
    .from("restaurants")
    .select("id, name, neighborhood")
    .is("image_url", null);

  let fixed = 0;

  for (const r of noImage || []) {
    try {
      const query = encodeURIComponent(`${r.name} ${r.neighborhood}`);
      const res = await fetch(
        `https://dapi.kakao.com/v2/search/image?query=${query}&size=1`,
        {
          cache: "no-store",
          headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
        }
      );
      const data = await res.json();
      const docs = data.documents || [];
      const imageUrl = docs[0]?.image_url || "";

      if (imageUrl) {
        await supabase.from("restaurants").update({ image_url: imageUrl }).eq("id", r.id);
        fixed++;
      }
    } catch {
      // skip
    }
  }

  return NextResponse.json({
    message: `중복 ${deleted}개 삭제, 썸네일 ${fixed}개 추가`,
    duplicates_deleted: deleted,
    thumbnails_fixed: fixed,
    remaining_no_image: (noImage?.length || 0) - fixed,
  });
}
