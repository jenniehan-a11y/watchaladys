"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Restaurant } from "@/src/lib/types";
import { supabase } from "@/src/lib/supabase";

interface RestaurantCardProps {
  restaurant: Restaurant;
  allRestaurants?: Restaurant[];
  onDelete: (id: string) => void;
}

export default function RestaurantCard({ restaurant, allRestaurants = [], onDelete }: RestaurantCardProps) {
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
        <img
          src={restaurant.image_url}
          alt={restaurant.name}
          onClick={handleThumbnailClick}
          className={`w-full aspect-square object-cover ${restaurant.instagram_url ? "cursor-pointer" : ""}`}
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      )}

      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">{restaurant.name}</h3>
            <p className="text-sm opacity-80">
              {restaurant.neighborhood} · {restaurant.category}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {restaurant.naver_rating && (
                <span className="text-xs bg-[#2D5016] text-[#F5F0E8] px-2 py-0.5 rounded-full">
                  N {restaurant.naver_rating}
                </span>
              )}
              {restaurant.nearest_station && (
                <span className="text-xs bg-[#8B4513] text-[#F5F0E8] px-2 py-0.5 rounded-full">
                  🚇 {restaurant.nearest_station} {restaurant.station_distance_min}분
                </span>
              )}
            </div>
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

            {/* Recommendations */}
            {allRestaurants.length > 1 && (() => {
              const sameNeighborhood = allRestaurants.filter(
                (r) => r.neighborhood === restaurant.neighborhood && r.id !== restaurant.id
              ).slice(0, 3);
              const sameCategory = allRestaurants.filter(
                (r) => r.category === restaurant.category && r.id !== restaurant.id && !sameNeighborhood.find(s => s.id === r.id)
              ).slice(0, 3);

              if (sameNeighborhood.length === 0 && sameCategory.length === 0) return null;

              return (
                <div className="space-y-2">
                  {sameNeighborhood.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold opacity-70">📍 {restaurant.neighborhood} 다른 맛집</p>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {sameNeighborhood.map((r) => (
                          <span key={r.id} className="text-xs bg-[#F5F0E8] text-[#3D1A1A] px-2 py-1 rounded-full">
                            {r.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {sameCategory.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold opacity-70">🍽 {restaurant.category} 추천</p>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {sameCategory.map((r) => (
                          <span key={r.id} className="text-xs bg-[#D4B8E0] text-[#3D1A1A] px-2 py-1 rounded-full">
                            {r.name} · {r.neighborhood}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
