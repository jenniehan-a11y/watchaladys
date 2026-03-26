import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SPREADSHEET_ID = "149LFV0BwC8Oz_wBMRtFK8Ru3CxANKn16oapVeEvdchg";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (char === '"') {
      if (inQuotes && csv[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && csv[i + 1] === "\n") i++;
      row.push(current.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }
  if (current || row.length > 0) {
    row.push(current.trim());
    if (row.some((cell) => cell !== "")) rows.push(row);
  }
  return rows;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`;
    const csvRes = await fetch(csvUrl, { cache: "no-store" });
    const csvText = await csvRes.text();

    const rows = parseCSV(csvText);
    if (rows.length < 2) {
      return NextResponse.json({ message: "No data in spreadsheet", synced: 0 });
    }

    const dataRows = rows.slice(1);
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: existing } = await supabase.from("restaurants").select("name, neighborhood");
    const existingSet = new Set(
      (existing || []).map((r: { name: string; neighborhood: string }) => `${r.name}__${r.neighborhood}`)
    );

    const newRestaurants = [];

    for (const row of dataRows) {
      const [name, region, neighborhood, category, naverUrl, instaUrl, status] = row;

      if (!name || !region || !neighborhood) continue;

      const key = `${name}__${neighborhood}`;
      if (existingSet.has(key)) continue;

      let imageUrl = "";
      if (naverUrl) {
        try {
          const placeIdMatch = naverUrl.match(/place\/(\d+)/);
          let placeId = placeIdMatch?.[1];

          if (!placeId && (naverUrl.includes("naver.me") || naverUrl.includes("naver.com"))) {
            const redirectRes = await fetch(naverUrl.trim(), {
              redirect: "manual",
              cache: "no-store",
              headers: { "User-Agent": "Mozilla/5.0" },
            });
            const location = redirectRes.headers.get("location") || "";
            placeId = location.match(/place\/(\d+)/)?.[1];
          }

          if (placeId) {
            const placeRes = await fetch(
              `https://map.naver.com/p/api/place/summary/${placeId}`,
              {
                cache: "no-store",
                headers: {
                  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                  Referer: "https://map.naver.com/p/",
                  Accept: "application/json",
                },
              }
            );
            const placeData = await placeRes.json();
            const images = placeData?.data?.placeDetail?.images?.images || [];
            imageUrl = images[0]?.origin || "";
          }
        } catch {
          // ignore
        }
      }

      newRestaurants.push({
        name: name.trim(),
        region: region.trim(),
        neighborhood: neighborhood.trim(),
        category: (category || "").trim(),
        naver_map_url: (naverUrl || "").trim() || null,
        instagram_url: (instaUrl || "").trim() || null,
        status: status?.trim() === "check" ? "visited" : "want_to_go",
        image_url: imageUrl || null,
        memo: null,
      });
    }

    if (newRestaurants.length > 0) {
      const { error } = await supabase.from("restaurants").insert(newRestaurants);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      message: `Synced ${newRestaurants.length} new restaurants`,
      synced: newRestaurants.length,
      total: dataRows.length,
    });
  } catch (err) {
    console.error("sync-sheets error:", err);
    return NextResponse.json({ error: "Sync failed: " + String(err) }, { status: 500 });
  }
}
