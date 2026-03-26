import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

async function searchImage(query: string): Promise<string> {
  try {
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://dapi.kakao.com/v2/search/image?query=${encoded}&size=1`,
      {
        cache: "no-store",
        headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
      }
    );
    const data = await res.json();
    return data.documents?.[0]?.image_url || "";
  } catch {
    return "";
  }
}

export async function GET() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Step 1: Remove duplicates
  const { data: all } = await supabase
    .from("restaurants")
    .select("id, name, neighborhood, image_url, instagram_url, created_at")
    .order("created_at", { ascending: false });

  if (!all) return NextResponse.json({ error: "DB 조회 실패" }, { status: 500 });

  const seen = new Map<string, string>();
  const toDelete: string[] = [];

  for (const r of all) {
    const key = `${r.name}__${r.neighborhood}`;
    if (seen.has(key)) {
      const existingId = seen.get(key)!;
      const existing = all.find((x) => x.id === existingId);
      if (!existing?.image_url && r.image_url) {
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

  // Step 2: Fix thumbnails - try multiple search queries
  const { data: noImage } = await supabase
    .from("restaurants")
    .select("id, name, neighborhood, category")
    .is("image_url", null);

  let thumbFixed = 0;

  for (const r of noImage || []) {
    // Try different search queries
    let imageUrl = await searchImage(`${r.name} ${r.neighborhood} 맛집`);
    if (!imageUrl) imageUrl = await searchImage(`${r.name} ${r.category}`);
    if (!imageUrl) imageUrl = await searchImage(`${r.name} 음식`);
    if (!imageUrl) imageUrl = await searchImage(`${r.neighborhood} ${r.category} 음식`);

    // Fallback: use a food placeholder based on category
    if (!imageUrl) {
      imageUrl = await searchImage(`${r.category} 음식 사진`);
    }

    if (imageUrl) {
      await supabase.from("restaurants").update({ image_url: imageUrl }).eq("id", r.id);
      thumbFixed++;
    }
  }

  // Step 3: Add Instagram links for restaurants without one
  const { data: noInsta } = await supabase
    .from("restaurants")
    .select("id, name")
    .is("instagram_url", null);

  let instaFixed = 0;

  for (const r of noInsta || []) {
    // Generate Instagram hashtag search URL
    const tag = r.name.replace(/\s+/g, "");
    const instaUrl = `https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`;
    await supabase.from("restaurants").update({ instagram_url: instaUrl }).eq("id", r.id);
    instaFixed++;
  }

  return NextResponse.json({
    message: `중복 ${deleted}개 삭제, 썸네일 ${thumbFixed}개 추가, 인스타 ${instaFixed}개 연결`,
    duplicates_deleted: deleted,
    thumbnails_fixed: thumbFixed,
    instagram_linked: instaFixed,
    remaining_no_image: (noImage?.length || 0) - thumbFixed,
  });
}
