"use client";

interface FilterBarProps {
  regions: string[];
  districts: string[];
  dongs: string[];
  categories: string[];
  selectedRegion: string;
  selectedDistrict: string;
  selectedDong: string;
  selectedCategory: string;
  selectedRound: string;
  sortBy: string;
  onRegionChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onDongChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onRoundChange: (value: string) => void;
  onSortChange: (value: string) => void;
}

export default function FilterBar({
  regions,
  districts,
  dongs,
  categories,
  selectedRegion,
  selectedDistrict,
  selectedDong,
  selectedCategory,
  selectedRound,
  sortBy,
  onRegionChange,
  onDistrictChange,
  onDongChange,
  onCategoryChange,
  onRoundChange,
  onSortChange,
}: FilterBarProps) {
  const selectClass =
    "px-3 py-2 rounded-lg bg-[#F5F0E8] border border-[#3D1A1A] text-[#3D1A1A] text-sm focus:outline-none focus:ring-2 focus:ring-[#6B7FD7]";

  const roundBtnClass = (value: string) =>
    `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
      selectedRound === value
        ? "bg-[#3D1A1A] text-[#F5F0E8]"
        : "bg-[#F5F0E8] border border-[#3D1A1A] text-[#3D1A1A]"
    }`;

  return (
    <div className="space-y-2">
      {/* 1차/2차 필터 */}
      <div className="flex gap-2">
        <button onClick={() => onRoundChange("")} className={roundBtnClass("")}>
          전체
        </button>
        <button onClick={() => onRoundChange("1차")} className={roundBtnClass("1차")}>
          🍽 1차
        </button>
        <button onClick={() => onRoundChange("2차")} className={roundBtnClass("2차")}>
          🍺 2차
        </button>
      </div>

      {/* 기존 필터 */}
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
          value={selectedDong}
          onChange={(e) => onDongChange(e.target.value)}
          className={selectClass}
        >
          <option value="">전체 동</option>
          {dongs.map((d) => (
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

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className={selectClass}
        >
          <option value="latest">최신순</option>
          <option value="rating">평점순</option>
          <option value="station">역 가까운순</option>
          <option value="popular">리뷰 많은순</option>
        </select>
      </div>
    </div>
  );
}
