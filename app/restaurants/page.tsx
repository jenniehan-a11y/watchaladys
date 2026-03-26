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
  const categories = useMemo(
    () => [...new Set(restaurants.map((r) => r.category))].sort(),
    [restaurants]
  );

  const filtered = restaurants.filter((r) => {
    if (r.status !== activeTab) return false;
    if (selectedRegion && r.region !== selectedRegion) return false;
    if (selectedNeighborhood && r.neighborhood !== selectedNeighborhood) return false;
    if (selectedCategory && r.category !== selectedCategory) return false;
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

      <section className="px-16 py-8">
        {loading ? (
          <p className="text-center text-[#3D1A1A]/60 py-12">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[#3D1A1A]/60 py-12">
            아직 저장된 맛집이 없어요
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-8">
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
