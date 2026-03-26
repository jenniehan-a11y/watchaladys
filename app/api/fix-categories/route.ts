import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const categoryMap: Record<string, string> = {
  "한정식": "한식", "국밥": "한식", "찌개": "한식", "삼겹살": "한식",
  "곱창": "한식", "막창": "한식", "곱창,막창,양": "한식", "족발,보쌈": "한식",
  "냉면": "한식", "칼국수": "한식", "백반": "한식", "분식": "한식", "떡볶이": "한식",
  "죽": "한식", "설렁탕": "한식", "감자탕": "한식", "순대": "한식", "치킨": "한식",
  "초밥": "일식", "일본식주점": "일식", "라멘": "일식", "돈카츠": "일식",
  "오마카세": "일식",
  "이탈리안": "양식", "파스타": "양식", "피자": "양식", "스테이크": "양식",
  "브런치": "양식", "버거": "양식", "프렌치": "양식",
  "중국집": "중식", "짜장면": "중식", "마라탕": "중식",
  "디저트카페": "카페", "떡카페": "카페", "베이커리": "카페",
  "브런치카페": "카페", "커피전문점": "카페",
  "호프,요리주점": "술집", "칵테일바": "술집", "와인바": "술집",
  "이자카야": "술집", "포장마차": "술집", "맥주,호프": "술집",
  "태국음식": "아시안", "베트남음식": "아시안", "인도음식": "아시안",
  "횟집": "해산물", "생선회": "해산물", "해물,생선요리": "해산물",
};

function getMainCategory(cat: string): string | null {
  if (categoryMap[cat]) return categoryMap[cat];
  for (const [key, val] of Object.entries(categoryMap)) {
    if (cat.includes(key)) return val;
  }
  return null;
}

export async function GET() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // 1. Delete cafes and bakeries
  await supabase.from("restaurants").delete().ilike("category", "%카페%");
  await supabase.from("restaurants").delete().ilike("category", "%베이커리%");
  await supabase.from("restaurants").delete().ilike("category", "%커피%");

  // 2. Fix remaining categories to main categories
  const { data: all } = await supabase.from("restaurants").select("id, category");
  let fixed = 0;

  for (const r of all || []) {
    const main = getMainCategory(r.category);
    if (main && main !== r.category) {
      await supabase.from("restaurants").update({ category: main }).eq("id", r.id);
      fixed++;
    }
  }

  return NextResponse.json({
    message: `카페 삭제 + ${fixed}개 카테고리 정리 완료`,
    fixed,
  });
}
