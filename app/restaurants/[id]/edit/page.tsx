"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import type { Restaurant } from "@/src/lib/types";
import RestaurantForm from "@/components/RestaurantForm";

export default function EditRestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", id)
        .single();
      if (data) setRestaurant(data);
      setLoading(false);
    }
    fetch();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-dvh bg-[#D4B8E0] flex items-center justify-center">
        <p className="text-[#3D1A1A]/60">불러오는 중...</p>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main className="min-h-dvh bg-[#D4B8E0] flex items-center justify-center">
        <p className="text-[#3D1A1A]/60">맛집을 찾을 수 없어요</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#D4B8E0]">
      <header className="sticky top-0 z-10 bg-[#D4B8E0] px-4 py-4 flex items-center gap-3">
        <Link href="/restaurants" className="text-[#3D1A1A] text-2xl leading-none">&larr;</Link>
        <h1 className="text-xl font-bold text-[#3D1A1A]">맛집 수정</h1>
      </header>
      <section className="px-4 pb-8">
        <RestaurantForm initialData={restaurant} />
      </section>
    </main>
  );
}
