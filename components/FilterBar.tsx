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
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      <select
        value={selectedNeighborhood}
        onChange={(e) => onNeighborhoodChange(e.target.value)}
        className={selectClass}
      >
        <option value="">전체 동네</option>
        {neighborhoods.map((n) => (
          <option key={n} value={n}>{n}</option>
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
