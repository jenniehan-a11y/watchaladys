"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Restaurant } from "@/src/lib/types";
import { supabase } from "@/src/lib/supabase";

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

  const handleThumbnailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (restaurant.instagram_url) {
      window.open(restaurant.instagram_url, "_blank");
    }
  };

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="rounded-2xl overflow-hidden cursor-pointer transition-all bg-[#E8652E] text-[#1A1A1A] hover:shadow-lg"
    >
      {/* Thumbnail */}
      {restaurant.image_url && (
        <div
          onClick={handleThumbnailClick}
          className={`w-full aspect-square bg-cover bg-center ${restaurant.instagram_url ? "cursor-pointer" : ""}`}
          style={{ backgroundImage: `url(${restaurant.image_url})` }}
        />
      )}

      <div className="p-4">
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
              <p className="text-sm italic">&quot;{restaurant.memo}&quot;</p>
            )}

            <div className="flex gap-2">
              <a
                href={restaurant.naver_map_url || undefined}
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
                href={restaurant.instagram_url || undefined}
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
    </div>
  );
}
