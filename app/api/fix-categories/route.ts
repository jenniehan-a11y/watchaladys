import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const VALID_CATEGORIES = ["한식", "일식", "양식", "중식", "술집", "해산물", "아시안", "기타"];

const keywordMap: [string, string][] = [
  // 한식
  ["갈비", "한식"], ["삼겹", "한식"], ["곱창", "한식"], ["막창", "한식"], ["족발", "한식"],
  ["보쌈", "한식"], ["냉면", "한식"], ["칼국수", "한식"], ["국수", "한식"], ["백반", "한식"],
  ["분식", "한식"], ["떡볶이", "한식"], ["설렁탕", "한식"], ["감자탕", "한식"], ["순대", "한식"],
  ["치킨", "한식"], ["삼계탕", "한식"], ["국밥", "한식"], ["찌개", "한식"], ["한정식", "한식"],
  ["닭요리", "한식"], ["돼지고기", "한식"], ["소고기", "한식"], ["기사식당", "한식"],
  ["죽", "한식"], ["복어", "한식"], ["뷔페", "한식"], ["구이", "한식"], ["전골", "한식"],
  ["한식", "한식"], ["교동", "한식"], ["노군꼬치", "한식"],
  // 일식
  ["일식", "일식"], ["초밥", "일식"], ["스시", "일식"], ["라멘", "일식"], ["돈카츠", "일식"],
  ["돈까스", "일식"], ["우동", "일식"], ["오마카세", "일식"], ["일본식주점", "일식"],
  ["이자카야", "일식"],
  // 양식
  ["양식", "양식"], ["이탈리안", "양식"], ["파스타", "양식"], ["피자", "양식"],
  ["스테이크", "양식"], ["브런치", "양식"], ["버거", "양식"], ["프렌치", "양식"],
  ["멕시칸", "양식"], ["브라질", "양식"], ["롯데리아", "양식"],
  // 중식
  ["중식", "중식"], ["중국", "중식"], ["짜장", "중식"], ["마라", "중식"],
  // 카페 (삭제 대상)
  ["카페", "DELETE"], ["커피", "DELETE"], ["디저트", "DELETE"], ["베이커리", "DELETE"],
  ["빽다방", "DELETE"], ["스타벅스", "DELETE"], ["다방", "DELETE"], ["블루보틀", "DELETE"],
  ["더벤티", "DELETE"],
  // 술집
  ["술집", "술집"], ["호프", "술집"], ["맥주", "술집"], ["요리주점", "술집"],
  ["칵테일", "술집"], ["와인바", "술집"], ["포장마차", "술집"], ["바", "술집"],
  ["생활맥주", "술집"], ["700비어", "술집"], ["금별맥주", "술집"], ["솔솔", "술집"],
  // 해산물
  ["횟집", "해산물"], ["생선", "해산물"], ["해물", "해산물"], ["게", "해산물"],
  ["대게", "해산물"], ["조개", "해산물"],
  // 아시안
  ["태국", "아시안"], ["베트남", "아시안"], ["인도", "아시안"], ["동남아", "아시안"],
];

function classify(category: string, name: string): string | "DELETE" {
  if (VALID_CATEGORIES.includes(category)) return category;

  const combined = `${category} ${name}`;
  for (const [keyword, mapped] of keywordMap) {
    if (combined.includes(keyword)) return mapped;
  }
  return "기타";
}

export async function GET() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: all } = await supabase.from("restaurants").select("id, name, category");
  if (!all) return NextResponse.json({ error: "DB 조회 실패" }, { status: 500 });

  let fixed = 0;
  let deleted = 0;

  for (const r of all) {
    const result = classify(r.category, r.name);

    if (result === "DELETE") {
      await supabase.from("restaurants").delete().eq("id", r.id);
      deleted++;
    } else if (result !== r.category) {
      await supabase.from("restaurants").update({ category: result }).eq("id", r.id);
      fixed++;
    }
  }

  return NextResponse.json({
    message: `카페 ${deleted}개 삭제, ${fixed}개 카테고리 정리`,
    deleted,
    fixed,
    total: all.length,
  });
}
