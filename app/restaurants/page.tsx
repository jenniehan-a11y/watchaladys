"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import type { Restaurant } from "@/src/lib/types";
import StatusTabs from "@/components/StatusTabs";
import FilterBar from "@/components/FilterBar";
import RestaurantCard from "@/components/RestaurantCard";

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activeTab, setActiveTab] = useState<"want_to_go" | "visited">("want_to_go");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRestaurants() {
      const { data, error } = await supabase
        .from("restaurants")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setRestaurants(data);
      setLoading(false);
    }
    fetchRestaurants();
  }, []);

  const regions = useMemo(
    () => [...new Set(restaurants.map((r) => r.region))].sort(),
    [restaurants]
  );
  const neighborhoods = useMemo(
    () =>
      [
        ...new Set(
          restaurants
            .filter((r) => !selectedRegion || r.region === selectedRegion)
            .map((r) => r.neighborhood)
        ),
      ].sort(),
    [restaurants, selectedRegion]
  );
  const categoryMap: Record<string, string> = {
    // 한식
    "한식": "한식", "한정식": "한식", "국밥": "한식", "찌개": "한식", "삼겹살": "한식",
    "곱창": "한식", "막창": "한식", "양": "한식", "곱창,막창,양": "한식", "족발,보쌈": "한식",
    "냉면": "한식", "칼국수": "한식", "백반": "한식", "분식": "한식", "떡볶이": "한식",
    "죽": "한식", "설렁탕": "한식", "감자탕": "한식", "순대": "한식", "치킨": "한식",
    // 일식
    "일식": "일식", "초밥": "일식", "일본식주점": "일식", "라멘": "일식", "돈카츠": "일식",
    "일식집": "일식", "오마카세": "일식",
    // 양식
    "양식": "양식", "이탈리안": "양식", "파스타": "양식", "피자": "양식", "스테이크": "양식",
    "브런치": "양식", "버거": "양식", "프렌치": "양식",
    // 중식
    "중식": "중식", "중국집": "중식", "짜장면": "중식", "마라탕": "중식",
    // 카페
    "카페": "카페", "디저트카페": "카페", "떡카페": "카페", "베이커리": "카페",
    "브런치카페": "카페", "커피전문점": "카페",
    // 술집
    "술집": "술집", "호프,요리주점": "술집", "칵테일바": "술집", "와인바": "술집",
    "이자카야": "술집", "포장마차": "술집", "맥주,호프": "술집",
    // 아시안
    "태국음식": "아시안", "베트남음식": "아시안", "인도음식": "아시안",
    // 해산물
    "해산물": "해산물", "횟집": "해산물", "생선회": "해산물", "해물,생선요리": "해산물",
  };

  const getMainCategory = (cat: string): string => {
    if (categoryMap[cat]) return categoryMap[cat];
    for (const [key, val] of Object.entries(categoryMap)) {
      if (cat.includes(key)) return val;
    }
    return cat;
  };

  const categories = useMemo(
    () => [...new Set(restaurants.map((r) => getMainCategory(r.category)))].sort(),
    [restaurants]
  );

  const filtered = restaurants.filter((r) => {
    if (r.status !== activeTab) return false;
    if (selectedRegion && r.region !== selectedRegion) return false;
    if (selectedNeighborhood && r.neighborhood !== selectedNeighborhood) return false;
    if (selectedCategory && getMainCategory(r.category) !== selectedCategory) return false;
    return true;
  });

  const handleDelete = (id: string) => {
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <main className="min-h-dvh bg-[#F5F0E8] pb-24">
      <header className="sticky top-0 z-10 bg-[#E5A830] px-4 py-4 space-y-3">
        <Link href="/" className="text-xl font-bold text-[#1A1A1A]">women&apos;s place</Link>
        <StatusTabs activeTab={activeTab} onTabChange={setActiveTab} />
        <FilterBar
          regions={regions}
          neighborhoods={neighborhoods}
          categories={categories}
          selectedRegion={selectedRegion}
          selectedNeighborhood={selectedNeighborhood}
          selectedCategory={selectedCategory}
          onRegionChange={(v) => {
            setSelectedRegion(v);
            setSelectedNeighborhood("");
          }}
          onNeighborhoodChange={setSelectedNeighborhood}
          onCategoryChange={setSelectedCategory}
        />
      </header>

      <section className="px-4 md:px-16 py-6 md:py-8">
        {loading ? (
          <p className="text-center text-[#3D1A1A]/60 py-12">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[#3D1A1A]/60 py-12">
            아직 저장된 맛집이 없어요
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {filtered.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} allRestaurants={restaurants} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </section>

      {/* FAB: Add restaurant */}
      <Link
        href="/restaurants/new"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#6B7FD7] text-[#F5F0E8] flex items-center justify-center text-3xl font-light shadow-lg hover:bg-[#5A6EC6] transition-colors"
      >
        +
      </Link>
    </main>
  );
}
