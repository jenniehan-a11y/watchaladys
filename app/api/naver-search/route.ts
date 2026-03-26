import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "검색어가 필요합니다" }, { status: 400 });
  }

  try {
    // Use Naver's place summary search by searching through the map API
    // We use the place search suggest endpoint
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://map.naver.com/p/api/search/allSearch?query=${encoded}&type=place&searchCoord=126.978;37.566&boundary=`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://map.naver.com/p/",
          "x-ncp-apigw-api-key": "",
        },
      }
    );

    const data = await res.json();
    const places = data?.result?.place?.list || [];

    // If captcha blocked, try fetching individual place by name
    if (places.length === 0) {
      // Fallback: return empty results
      return NextResponse.json({ results: [] });
    }

    const results = places.slice(0, 5).map((p: Record<string, string | string[]>) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      category: Array.isArray(p.category) ? p.category.join(",") : p.category,
      thumUrl: p.thumUrl,
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
