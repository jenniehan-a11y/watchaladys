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
            가고싶다
          </button>
          <button type="button" onClick={() => handleChange("status", "visited")}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${form.status === "visited" ? "bg-[#6B7FD7] text-[#F5F0E8]" : "bg-[#F5F0E8] text-[#3D1A1A] border-2 border-[#3D1A1A]/20"}`}>
            다녀왔다
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
