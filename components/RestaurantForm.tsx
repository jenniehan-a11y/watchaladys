"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import type { Restaurant, RestaurantInsert } from "@/src/lib/types";

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
    image_url: initialData?.image_url ?? "",
    latitude: initialData?.latitude ?? null,
    longitude: initialData?.longitude ?? null,
    naver_rating: initialData?.naver_rating ?? null,
    kakao_rating: initialData?.kakao_rating ?? null,
    naver_review_count: initialData?.naver_review_count ?? null,
    kakao_review_count: initialData?.kakao_review_count ?? null,
    nearest_station: initialData?.nearest_station ?? null,
    station_distance_min: initialData?.station_distance_min ?? null,
    dong: initialData?.dong ?? null,
  });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetching, setFetching] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const handleChange = (field: keyof RestaurantInsert, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Fetch place info by Naver Map link (naver.me or map.naver.com)
  const handleNaverFetch = async (url: string) => {
    setFetching(true);
    try {
      const res = await fetch("/api/naver-place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        region: data.region || prev.region,
        neighborhood: data.neighborhood || prev.neighborhood,
        category: data.category || prev.category,
        naver_map_url: data.naver_map_url || url,
        image_url: data.image_url || prev.image_url,
      }));
      setShowMap(false);
      setSearchQuery("");
    } catch {
      setForm((prev) => ({ ...prev, naver_map_url: url }));
    }
    setFetching(false);
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
  };

  // Detect paste of Naver Map link
  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted.includes("naver.me/") || pasted.includes("map.naver.com")) {
      e.preventDefault();
      setSearchQuery(pasted);
      handleNaverFetch(pasted);
    }
  };

  // Manual fetch button
  const handleManualFetch = () => {
    if (searchQuery.includes("naver.me/") || searchQuery.includes("map.naver.com")) {
      handleNaverFetch(searchQuery);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      naver_map_url: form.naver_map_url || null,
      instagram_url: form.instagram_url || null,
      memo: form.memo || null,
      image_url: form.image_url || null,
    };

    if (isEditing) {
      await supabase.from("restaurants").update(payload).eq("id", initialData.id);
    } else {
      await supabase.from("restaurants").insert(payload);
    }

    router.push("/restaurants");
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-[#F5F0E8] border-2 border-[#3D1A1A]/20 text-[#3D1A1A] placeholder:text-[#3D1A1A]/40 focus:outline-none focus:border-[#6B7FD7] transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Search section */}
      {!isEditing && (
        <div className="bg-[#2D5016] rounded-2xl p-4 space-y-3">
          <label className="block text-sm font-semibold text-[#F5F0E8]">
            맛집 검색
          </label>

          {/* Search input + Naver Map link input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onPaste={handlePaste}
              placeholder="네이버 지도 링크 붙여넣기"
              className="flex-1 px-4 py-3 rounded-xl bg-[#F5F0E8] border-2 border-transparent text-[#3D1A1A] placeholder:text-[#3D1A1A]/40 focus:outline-none focus:border-[#6B7FD7] text-sm"
            />
            <button
              type="button"
              onClick={handleManualFetch}
              disabled={fetching || !searchQuery}
              className="px-4 py-3 rounded-xl bg-[#E8652E] text-[#F5F0E8] font-semibold text-sm hover:bg-[#D55A25] transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {fetching ? "..." : "가져오기"}
            </button>
          </div>
          {!showMap && (
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="text-xs text-[#F5F0E8]/80 underline"
            >
              네이버 지도에서 직접 찾기
            </button>
          )}

          {fetching && (
            <p className="text-xs text-[#F5F0E8]/80">가게 정보 가져오는 중...</p>
          )}

          <p className="text-xs text-[#F5F0E8]/60">
            네이버 지도 링크를 붙여넣으면 자동으로 정보를 가져와요
          </p>

          {/* Embedded Naver Map */}
          {showMap && (
            <div className="space-y-2">
              <div className="rounded-xl overflow-hidden bg-white">
                <iframe
                  src={`https://map.naver.com/p/search/${encodeURIComponent(searchQuery || "맛집")}`}
                  className="w-full h-96 border-0"
                  allow="geolocation"
                />
              </div>
              <p className="text-xs text-[#F5F0E8]/80">
                위 지도에서 가게를 찾은 후 &quot;공유&quot; → 링크 복사 → 위 입력창에 붙여넣기
              </p>
              <button
                type="button"
                onClick={() => setShowMap(false)}
                className="text-xs text-[#F5F0E8]/60 underline"
              >
                지도 닫기
              </button>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-[#3D1A1A] mb-1">가게명 *</label>
        <input type="text" required value={form.name} onChange={(e) => handleChange("name", e.target.value)} placeholder="가게 이름" className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#3D1A1A] mb-1">지역 *</label>
        <input type="text" required value={form.region} onChange={(e) => handleChange("region", e.target.value)} placeholder="예: 서울, 부산, 제주" className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#3D1A1A] mb-1">동네 *</label>
        <input type="text" required value={form.neighborhood} onChange={(e) => handleChange("neighborhood", e.target.value)} placeholder="예: 합정, 성수, 연남" className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#3D1A1A] mb-1">카테고리 *</label>
        <input type="text" required value={form.category} onChange={(e) => handleChange("category", e.target.value)} placeholder="예: 한식, 일식, 카페, 술집" className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#3D1A1A] mb-1">상태 *</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => handleChange("status", "want_to_go")}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${form.status === "want_to_go" ? "bg-[#E8652E] text-[#F5F0E8]" : "bg-[#F5F0E8] text-[#3D1A1A] border-2 border-[#3D1A1A]/20"}`}>
            want
          </button>
          <button type="button" onClick={() => handleChange("status", "visited")}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${form.status === "visited" ? "bg-[#6B7FD7] text-[#F5F0E8]" : "bg-[#F5F0E8] text-[#3D1A1A] border-2 border-[#3D1A1A]/20"}`}>
            check
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#3D1A1A] mb-1">네이버 지도 링크</label>
        <input type="url" value={form.naver_map_url ?? ""} onChange={(e) => handleChange("naver_map_url", e.target.value)} placeholder="https://naver.me/..." className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#3D1A1A] mb-1">인스타그램 링크</label>
        <input type="url" value={form.instagram_url ?? ""} onChange={(e) => handleChange("instagram_url", e.target.value)} placeholder="https://instagram.com/..." className={inputClass} />
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#3D1A1A] mb-1">메모</label>
        <textarea value={form.memo ?? ""} onChange={(e) => handleChange("memo", e.target.value)} placeholder="간단한 메모 (선택)" rows={3} className={inputClass + " resize-none"} />
      </div>

      <button type="submit" disabled={saving}
        className="w-full py-4 rounded-xl bg-[#2D5016] text-[#F5F0E8] font-bold text-lg hover:bg-[#3D6A20] transition-colors disabled:opacity-50">
        {saving ? "저장 중..." : isEditing ? "수정하기" : "저장하기"}
      </button>
    </form>
  );
}
