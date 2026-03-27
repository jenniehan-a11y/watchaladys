"use client";

interface FilterBarProps {
  regions: string[];
  districts: string[];
  categories: string[];
  selectedRegion: string;
  selectedDistrict: string;
  selectedCategory: string;
  onRegionChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export default function FilterBar({
  regions,
  districts,
  categories,
  selectedRegion,
  selectedDistrict,
  selectedCategory,
  onRegionChange,
  onDistrictChange,
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
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      <select
        value={selectedDistrict}
        onChange={(e) => onDistrictChange(e.target.value)}
        className={selectClass}
      >
        <option value="">전체 시/구</option>
        {districts.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className={selectClass}
      >
        <option value="">전체 카테고리</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );
}
