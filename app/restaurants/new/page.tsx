"use client";

import RestaurantForm from "@/components/RestaurantForm";
import Link from "next/link";

export default function NewRestaurantPage() {
  return (
    <main className="min-h-dvh bg-[#D4B8E0]">
      <header className="sticky top-0 z-10 bg-[#D4B8E0] px-4 py-4 flex items-center gap-3">
        <Link href="/restaurants" className="text-[#3D1A1A] text-2xl leading-none">&larr;</Link>
        <h1 className="text-xl font-bold text-[#3D1A1A]">맛집 추가</h1>
      </header>
      <section className="px-4 pb-8">
        <RestaurantForm />
      </section>
    </main>
  );
}
