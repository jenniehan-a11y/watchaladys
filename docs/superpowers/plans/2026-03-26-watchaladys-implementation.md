# watchaladys Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a restaurant bookmarking & sharing website with vintage design, Supabase backend, and no auth.

**Architecture:** Next.js App Router with client-side Supabase SDK for CRUD. Three pages: landing (soju bottle), restaurant list with filters/tabs, and add/edit forms. All data stored in a single `restaurants` table with public RLS.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS, Supabase JS SDK, TypeScript

---

## File Structure

```
~/watchaladys/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with fonts, global styles
│   │   ├── page.tsx                # Landing page (soju bottle)
│   │   ├── globals.css             # Tailwind + custom CSS variables
│   │   └── restaurants/
│   │       ├── page.tsx            # Restaurant list (tabs, filters, cards)
│   │       ├── new/
│   │       │   └── page.tsx        # Add restaurant form
│   │       └── [id]/
│   │           └── edit/
│   │               └── page.tsx    # Edit restaurant form
│   ├── components/
│   │   ├── SojuBottle.tsx          # SVG soju bottle component
│   │   ├── RestaurantCard.tsx      # Single restaurant card
│   │   ├── RestaurantForm.tsx      # Shared add/edit form
│   │   ├── FilterBar.tsx           # Region/neighborhood/category filters
│   │   └── StatusTabs.tsx          # Want-to-go / Visited tabs
│   └── lib/
│       ├── supabase.ts             # Supabase client singleton
│       └── types.ts                # Restaurant type definition
├── .env.local                      # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
├── supabase-schema.sql             # SQL for creating the table + RLS
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `~/watchaladys/` (entire project via create-next-app)
- Modify: `package.json` (add supabase dependency)
- Create: `.env.local`

- [ ] **Step 1: Create Next.js project**

```bash
cd ~
npx create-next-app@latest watchaladys --yes
```

This creates a Next.js 16 project with TypeScript, Tailwind CSS, ESLint, and App Router enabled by default.

- [ ] **Step 2: Install Supabase SDK**

```bash
cd ~/watchaladys
npm install @supabase/supabase-js
```

- [ ] **Step 3: Create .env.local**

Create `~/watchaladys/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Note: The user must replace these with their actual Supabase project credentials. They can create a free project at https://supabase.com.

- [ ] **Step 4: Verify project runs**

```bash
cd ~/watchaladys
npm run dev
```

Expected: Dev server starts at localhost:3000, default Next.js page loads.

- [ ] **Step 5: Commit**

```bash
cd ~/watchaladys
git add -A
git commit -m "chore: scaffold Next.js project with Supabase SDK"
```

---

## Task 2: Supabase Schema & Client

**Files:**
- Create: `supabase-schema.sql`
- Create: `src/lib/supabase.ts`
- Create: `src/lib/types.ts`

- [ ] **Step 1: Create SQL schema file**

Create `~/watchaladys/supabase-schema.sql`:

```sql
-- Run this in Supabase SQL Editor to create the restaurants table

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text not null,
  neighborhood text not null,
  category text not null,
  status text not null check (status in ('want_to_go', 'visited')),
  naver_map_url text,
  instagram_url text,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS but allow all operations (public access, no auth)
alter table restaurants enable row level security;

create policy "Allow all select" on restaurants for select using (true);
create policy "Allow all insert" on restaurants for insert with check (true);
create policy "Allow all update" on restaurants for update using (true);
create policy "Allow all delete" on restaurants for delete using (true);

-- Auto-update updated_at on row changes
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger restaurants_updated_at
  before update on restaurants
  for each row execute function update_updated_at();
```

- [ ] **Step 2: Create TypeScript types**

Create `~/watchaladys/src/lib/types.ts`:

```typescript
export interface Restaurant {
  id: string;
  name: string;
  region: string;
  neighborhood: string;
  category: string;
  status: "want_to_go" | "visited";
  naver_map_url: string | null;
  instagram_url: string | null;
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export type RestaurantInsert = Omit<Restaurant, "id" | "created_at" | "updated_at">;
export type RestaurantUpdate = Partial<RestaurantInsert>;
```

- [ ] **Step 3: Create Supabase client**

Create `~/watchaladys/src/lib/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase.ts src/lib/types.ts supabase-schema.sql
git commit -m "feat: add Supabase schema, client, and TypeScript types"
```

---

## Task 3: Global Styles & Layout

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Set up global CSS with vintage color palette**

Replace `~/watchaladys/src/app/globals.css` with:

```css
@import "tailwindcss";

:root {
  --color-green: #2D5016;
  --color-orange: #E8652E;
  --color-lavender: #D4B8E0;
  --color-purple-blue: #6B7FD7;
  --color-dark-brown: #3D1A1A;
  --color-red: #C42B2B;
  --color-off-white: #F5F0E8;
  --color-black: #1A1A1A;
}

body {
  font-family: "Pretendard", sans-serif;
  color: var(--color-black);
  background: var(--color-off-white);
}
```

- [ ] **Step 2: Set up root layout with Pretendard font**

Replace `~/watchaladys/src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "watchaladys",
  description: "맛집 저장 & 공유",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify layout renders**

```bash
npm run dev
```

Expected: Page loads with Pretendard font and off-white background.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: set up vintage color palette and Pretendard font"
```

---

## Task 4: Landing Page with Soju Bottle

**Files:**
- Create: `src/components/SojuBottle.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create SojuBottle SVG component**

Create `~/watchaladys/src/components/SojuBottle.tsx`:

```tsx
export default function SojuBottle() {
  return (
    <svg
      viewBox="0 0 200 500"
      className="w-48 sm:w-56 md:w-64 cursor-pointer transition-transform hover:scale-105 active:scale-95"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bottle cap */}
      <rect x="80" y="0" width="40" height="20" rx="4" fill="#1A1A1A" />

      {/* Bottle neck */}
      <rect x="85" y="20" width="30" height="80" rx="6" fill="#D4B8E0" />

      {/* Bottle neck taper */}
      <path
        d="M85 100 Q85 130 60 150 L60 150 L140 150 Q115 130 115 100 Z"
        fill="#D4B8E0"
      />

      {/* Bottle body */}
      <rect x="60" y="150" width="80" height="300" rx="8" fill="#D4B8E0" />

      {/* Bottle bottom */}
      <rect x="60" y="440" width="80" height="10" rx="4" fill="#B89CC8" />

      {/* Label background */}
      <rect x="65" y="200" width="70" height="180" rx="4" fill="#E8652E" />

      {/* Polka dots on label */}
      <circle cx="85" cy="225" r="10" fill="#6B7FD7" />
      <circle cx="115" cy="250" r="8" fill="#6B7FD7" />
      <circle cx="80" cy="280" r="12" fill="#6B7FD7" />
      <circle cx="120" cy="310" r="9" fill="#6B7FD7" />
      <circle cx="95" cy="345" r="11" fill="#6B7FD7" />

      {/* Label text */}
      <text
        x="100"
        y="270"
        textAnchor="middle"
        fill="#1A1A1A"
        fontSize="9"
        fontWeight="bold"
        fontFamily="serif"
      >
        watchaladys
      </text>
    </svg>
  );
}
```

- [ ] **Step 2: Create landing page**

Replace `~/watchaladys/src/app/page.tsx` with:

```tsx
import Link from "next/link";
import SojuBottle from "@/components/SojuBottle";

export default function Home() {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-[#2D5016]">
      <Link href="/restaurants" aria-label="맛집 목록으로 이동">
        <SojuBottle />
      </Link>
    </main>
  );
}
```

- [ ] **Step 3: Verify landing page**

```bash
npm run dev
```

Expected: Green background fills the screen, lavender soju bottle with orange label and blue polka dots is centered. Clicking the bottle navigates to `/restaurants`.

- [ ] **Step 4: Commit**

```bash
git add src/components/SojuBottle.tsx src/app/page.tsx
git commit -m "feat: add landing page with soju bottle SVG"
```

---

## Task 5: Restaurant List Page — Tabs & Filters

**Files:**
- Create: `src/components/StatusTabs.tsx`
- Create: `src/components/FilterBar.tsx`
- Create: `src/app/restaurants/page.tsx`

- [ ] **Step 1: Create StatusTabs component**

Create `~/watchaladys/src/components/StatusTabs.tsx`:

```tsx
"use client";

interface StatusTabsProps {
  activeTab: "want_to_go" | "visited";
  onTabChange: (tab: "want_to_go" | "visited") => void;
}

export default function StatusTabs({ activeTab, onTabChange }: StatusTabsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onTabChange("want_to_go")}
        className={`px-5 py-2 rounded-full font-semibold text-sm transition-colors ${
          activeTab === "want_to_go"
            ? "bg-[#E8652E] text-[#F5F0E8]"
            : "bg-[#F5F0E8] text-[#3D1A1A] border border-[#3D1A1A]"
        }`}
      >
        가고싶다
      </button>
      <button
        onClick={() => onTabChange("visited")}
        className={`px-5 py-2 rounded-full font-semibold text-sm transition-colors ${
          activeTab === "visited"
            ? "bg-[#6B7FD7] text-[#F5F0E8]"
            : "bg-[#F5F0E8] text-[#3D1A1A] border border-[#3D1A1A]"
        }`}
      >
        다녀왔다
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create FilterBar component**

Create `~/watchaladys/src/components/FilterBar.tsx`:

```tsx
"use client";

interface FilterBarProps {
  regions: string[];
  neighborhoods: string[];
  categories: string[];
  selectedRegion: string;
  selectedNeighborhood: string;
  selectedCategory: string;
  onRegionChange: (value: string) => void;
  onNeighborhoodChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export default function FilterBar({
  regions,
  neighborhoods,
  categories,
  selectedRegion,
  selectedNeighborhood,
  selectedCategory,
  onRegionChange,
  onNeighborhoodChange,
  onCategoryChange,
}: FilterBarProps) {
  const selectClass =
    "px-3 py-2 rounded-lg bg-[#F5F0E8] border border-[#3D1A1A] text-[#3D1A1A] text-sm focus:outline-none focus:ring-2 focus:ring-[#6B7FD7]";

  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={selectedRegion}
        onChange={(e) => onRegionChange(e.target.value)}
        className={selectClass}
      >
        <option value="">전체 지역</option>
        {regions.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <select
        value={selectedNeighborhood}
        onChange={(e) => onNeighborhoodChange(e.target.value)}
        className={selectClass}
      >
        <option value="">전체 동네</option>
        {neighborhoods.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className={selectClass}
      >
        <option value="">전체 카테고리</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 3: Create RestaurantCard component**

Create `~/watchaladys/src/components/RestaurantCard.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Restaurant } from "@/lib/types";
import { supabase } from "@/lib/supabase";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onDelete: (id: string) => void;
}

export default function RestaurantCard({ restaurant, onDelete }: RestaurantCardProps) {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`"${restaurant.name}" 을(를) 삭제할까요?`)) return;
    const { error } = await supabase
      .from("restaurants")
      .delete()
      .eq("id", restaurant.id);
    if (!error) onDelete(restaurant.id);
  };

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="rounded-2xl p-4 cursor-pointer transition-all bg-[#E8652E] text-[#1A1A1A] hover:shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">{restaurant.name}</h3>
          <p className="text-sm opacity-80">
            {restaurant.neighborhood} · {restaurant.category}
          </p>
        </div>
        <span className="text-xs bg-[#F5F0E8] text-[#3D1A1A] px-2 py-1 rounded-full">
          {restaurant.region}
        </span>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-[#1A1A1A]/20 space-y-3">
          {restaurant.memo && (
            <p className="text-sm italic">"{restaurant.memo}"</p>
          )}

          <div className="flex gap-2">
            <a
              href={restaurant.naver_map_url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`flex-1 text-center py-2 rounded-lg text-sm font-semibold transition-colors ${
                restaurant.naver_map_url
                  ? "bg-[#2D5016] text-[#F5F0E8] hover:bg-[#3D6A20]"
                  : "bg-[#1A1A1A]/20 text-[#1A1A1A]/40 pointer-events-none"
              }`}
            >
              네이버 지도
            </a>
            <a
              href={restaurant.instagram_url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`flex-1 text-center py-2 rounded-lg text-sm font-semibold transition-colors ${
                restaurant.instagram_url
                  ? "bg-[#D4B8E0] text-[#3D1A1A] hover:bg-[#C4A0D4]"
                  : "bg-[#1A1A1A]/20 text-[#1A1A1A]/40 pointer-events-none"
              }`}
            >
              인스타그램
            </a>
          </div>

          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/restaurants/${restaurant.id}/edit`);
              }}
              className="flex-1 py-2 rounded-lg text-sm font-semibold bg-[#F5F0E8] text-[#3D1A1A] hover:bg-[#E8E0D4]"
            >
              수정
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="flex-1 py-2 rounded-lg text-sm font-semibold bg-[#C42B2B] text-[#F5F0E8] hover:bg-[#A82020]"
            >
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create restaurants list page**

Create `~/watchaladys/src/app/restaurants/page.tsx`:

```tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Restaurant } from "@/lib/types";
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
    if (selectedNeighborhood && r.neighborhood !== selectedNeighborhood)
      return false;
    if (selectedCategory && r.category !== selectedCategory) return false;
    return true;
  });

  const handleDelete = (id: string) => {
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <main className="min-h-dvh bg-[#F5F0E8] pb-24">
      <header className="sticky top-0 z-10 bg-[#2D5016] px-4 py-4 space-y-3">
        <h1 className="text-xl font-bold text-[#F5F0E8]">watchaladys</h1>
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

      <section className="px-4 py-4 space-y-3">
        {loading ? (
          <p className="text-center text-[#3D1A1A]/60 py-12">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-[#3D1A1A]/60 py-12">
            아직 저장된 맛집이 없어요
          </p>
        ) : (
          filtered.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} onDelete={handleDelete} />
          ))
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
```

- [ ] **Step 5: Verify list page renders**

```bash
npm run dev
```

Navigate to `/restaurants`. Expected: Green header with tabs and filters, empty state message, purple-blue FAB button at bottom-right.

- [ ] **Step 6: Commit**

```bash
git add src/components/StatusTabs.tsx src/components/FilterBar.tsx src/components/RestaurantCard.tsx src/app/restaurants/page.tsx
git commit -m "feat: add restaurant list page with tabs, filters, and cards"
```

---

## Task 6: Restaurant Add & Edit Forms

**Files:**
- Create: `src/components/RestaurantForm.tsx`
- Create: `src/app/restaurants/new/page.tsx`
- Create: `src/app/restaurants/[id]/edit/page.tsx`

- [ ] **Step 1: Create shared RestaurantForm component**

Create `~/watchaladys/src/components/RestaurantForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Restaurant, RestaurantInsert } from "@/lib/types";

interface RestaurantFormProps {
  initialData?: Restaurant;
}

export default function RestaurantForm({ initialData }: RestaurantFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [form, setForm] = useState<RestaurantInsert>({
    name: initialData?.name ?? "",
    region: initialData?.region ?? "",
    neighborhood: initialData?.neighborhood ?? "",
    category: initialData?.category ?? "",
    status: initialData?.status ?? "want_to_go",
    naver_map_url: initialData?.naver_map_url ?? "",
    instagram_url: initialData?.instagram_url ?? "",
    memo: initialData?.memo ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof RestaurantInsert, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      naver_map_url: form.naver_map_url || null,
      instagram_url: form.instagram_url || null,
      memo: form.memo || null,
    };

    if (isEditing) {
      await supabase
        .from("restaurants")
        .update(payload)
        .eq("id", initialData.id);
    } else {
      await supabase.from("restaurants").insert(payload);
    }

    router.push("/restaurants");
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-[#F5F0E8] border-2 border-[#3D1A1A]/20 text-[#3D1A1A] placeholder:text-[#3D1A1A]/40 focus:outline-none focus:border-[#6B7FD7] transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-[#3D1A1A] mb-1">
          가게명 *
        </label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="가게 이름"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#3D1A1A] mb-1">
          지역 *
        </label>
        <input
          type="text"
          required
          value={form.region}
          onChange={(e) => handleChange("region", e.target.value)}
          placeholder="예: 서울, 부산, 제주"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#3D1A1A] mb-1">
          동네 *
        </label>
        <input
          type="text"
          required
          value={form.neighborhood}
          onChange={(e) => handleChange("neighborhood", e.target.value)}
          placeholder="예: 합정, 성수, 연남"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#3D1A1A] mb-1">
          카테고리 *
        </label>
        <input
          type="text"
          required
          value={form.category}
          onChange={(e) => handleChange("category", e.target.value)}
          placeholder="예: 한식, 일식, 카페, 술집"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#3D1A1A] mb-1">
          상태 *
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleChange("status", "want_to_go")}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${
              form.status === "want_to_go"
                ? "bg-[#E8652E] text-[#F5F0E8]"
                : "bg-[#F5F0E8] text-[#3D1A1A] border-2 border-[#3D1A1A]/20"
            }`}
          >
            가고싶다
          </button>
          <button
            type="button"
            onClick={() => handleChange("status", "visited")}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${
              form.status === "visited"
                ? "bg-[#6B7FD7] text-[#F5F0E8]"
                : "bg-[#F5F0E8] text-[#3D1A1A] border-2 border-[#3D1A1A]/20"
            }`}
          >
            다녀왔다
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#3D1A1A] mb-1">
          네이버 지도 링크
        </label>
        <input
          type="url"
          value={form.naver_map_url ?? ""}
          onChange={(e) => handleChange("naver_map_url", e.target.value)}
          placeholder="https://naver.me/..."
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#3D1A1A] mb-1">
          인스타그램 링크
        </label>
        <input
          type="url"
          value={form.instagram_url ?? ""}
          onChange={(e) => handleChange("instagram_url", e.target.value)}
          placeholder="https://instagram.com/..."
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#3D1A1A] mb-1">
          메모
        </label>
        <textarea
          value={form.memo ?? ""}
          onChange={(e) => handleChange("memo", e.target.value)}
          placeholder="간단한 메모 (선택)"
          rows={3}
          className={inputClass + " resize-none"}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full py-4 rounded-xl bg-[#2D5016] text-[#F5F0E8] font-bold text-lg hover:bg-[#3D6A20] transition-colors disabled:opacity-50"
      >
        {saving ? "저장 중..." : isEditing ? "수정하기" : "저장하기"}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create add restaurant page**

Create `~/watchaladys/src/app/restaurants/new/page.tsx`:

```tsx
import RestaurantForm from "@/components/RestaurantForm";
import Link from "next/link";

export default function NewRestaurantPage() {
  return (
    <main className="min-h-dvh bg-[#D4B8E0]">
      <header className="sticky top-0 z-10 bg-[#D4B8E0] px-4 py-4 flex items-center gap-3">
        <Link
          href="/restaurants"
          className="text-[#3D1A1A] text-2xl leading-none"
        >
          &larr;
        </Link>
        <h1 className="text-xl font-bold text-[#3D1A1A]">맛집 추가</h1>
      </header>
      <section className="px-4 pb-8">
        <RestaurantForm />
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Create edit restaurant page**

Create `~/watchaladys/src/app/restaurants/[id]/edit/page.tsx`:

```tsx
"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Restaurant } from "@/lib/types";
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
        <Link
          href="/restaurants"
          className="text-[#3D1A1A] text-2xl leading-none"
        >
          &larr;
        </Link>
        <h1 className="text-xl font-bold text-[#3D1A1A]">맛집 수정</h1>
      </header>
      <section className="px-4 pb-8">
        <RestaurantForm initialData={restaurant} />
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Verify forms work**

```bash
npm run dev
```

Navigate to `/restaurants/new`. Expected: Lavender background, form with all fields, status toggle, save button. Submit should save to Supabase and redirect to list.

- [ ] **Step 5: Commit**

```bash
git add src/components/RestaurantForm.tsx src/app/restaurants/new/page.tsx src/app/restaurants/\[id\]/edit/page.tsx
git commit -m "feat: add restaurant create and edit forms"
```

---

## Task 7: Final Polish & Verification

**Files:**
- Possibly tweak any component for visual/functional issues

- [ ] **Step 1: Run full build check**

```bash
cd ~/watchaladys
npm run build
```

Expected: Build completes with no errors.

- [ ] **Step 2: End-to-end manual verification**

Run `npm run dev` and verify:
1. `/` — Green background, soju bottle centered, clickable
2. Click bottle → navigates to `/restaurants`
3. `/restaurants` — Tabs (가고싶다/다녀왔다), filters, empty state
4. Click FAB (+) → navigates to `/restaurants/new`
5. Fill form, save → redirects to list, new card appears
6. Click card → expands to show links and edit/delete buttons
7. Naver/Instagram buttons: active if link exists, disabled if not
8. Edit button → pre-filled form, save updates the record
9. Delete button → confirms, removes card from list
10. Tab switching filters by status
11. Region/neighborhood/category filters work

- [ ] **Step 3: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final polish and fixes"
```

- [ ] **Step 4: Remind user to set up Supabase**

Tell user:
1. Create a Supabase project at supabase.com
2. Run the SQL from `supabase-schema.sql` in Supabase SQL Editor
3. Copy the project URL and anon key into `.env.local`
4. For Vercel deployment: add the same env vars in Vercel project settings
