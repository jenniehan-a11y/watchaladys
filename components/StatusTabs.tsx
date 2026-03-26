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
        want
      </button>
      <button
        onClick={() => onTabChange("visited")}
        className={`px-5 py-2 rounded-full font-semibold text-sm transition-colors ${
          activeTab === "visited"
            ? "bg-[#6B7FD7] text-[#F5F0E8]"
            : "bg-[#F5F0E8] text-[#3D1A1A] border border-[#3D1A1A]"
        }`}
      >
        check
      </button>
    </div>
  );
}
