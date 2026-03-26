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
