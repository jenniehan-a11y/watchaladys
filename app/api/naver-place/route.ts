import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "URL이 필요합니다" }, { status: 400 });
  }

  try {
    let placeId = "";

    // Check if URL already contains place ID
    const directMatch = url.match(/place\/(\d+)/);
    if (directMatch) {
      placeId = directMatch[1];
    } else {
      // Follow the short URL redirect to get the place ID
      const redirectRes = await fetch(url.trim(), {
        redirect: "manual",
        cache: "no-store",
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
      });

      const location = redirectRes.headers.get("location") || "";
      const match = location.match(/place\/(\d+)/);
      if (!match) {
        // Try following one more redirect
        const redirectRes2 = await fetch(location || url.trim(), {
          redirect: "manual",
          headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
        });
        const location2 = redirectRes2.headers.get("location") || "";
        const match2 = location2.match(/place\/(\d+)/);
        if (!match2) {
          return NextResponse.json(
            { error: "장소 ID를 찾을 수 없습니다. 네이버 지도 링크인지 확인해주세요." },
            { status: 400 }
          );
        }
        placeId = match2[1];
      } else {
        placeId = match[1];
      }
    }

    // Fetch place details
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

    const placeText = await placeRes.text();
    let detail = null;
    try {
      const placeData = JSON.parse(placeText);
      detail = placeData?.data?.placeDetail;
    } catch {
      // JSON parse failed
    }

    if (!detail) {
      // Fallback: return just the naver map URL with place ID
      return NextResponse.json({
        name: "",
        region: "",
        neighborhood: "",
        category: "",
        naver_map_url: `https://map.naver.com/p/entry/place/${placeId}`,
        image_url: "",
      });
    }

    const formattedAddress = detail.address?.formattedAddress || "";
    const addressParts = formattedAddress.split(" ");
    const region = addressParts[0] || "";

    // 주소에서 동/읍/리/로까지만 추출 (번지 제외)
    let neighborhood = "";
    if (region.endsWith("도") && addressParts.length >= 3) {
      // "경기도 부천시 원미구 중동 123-4" → "부천시 원미구 중동"
      const parts = addressParts.slice(1);
      const dongIdx = parts.findIndex((p) => /[동읍리로길]$/.test(p));
      neighborhood = dongIdx >= 0 ? parts.slice(0, dongIdx + 1).join(" ") : parts.slice(0, 3).join(" ");
    } else {
      // "서울특별시 마포구 합정동 123" → "합정동"
      const parts = addressParts.slice(2);
      const dongIdx = parts.findIndex((p) => /[동읍리로길]$/.test(p));
      neighborhood = dongIdx >= 0 ? parts.slice(0, dongIdx + 1).join(" ") : parts[0] || addressParts[1] || "";
    }

    const categoryRaw = detail.category?.category || "";
    const category = categoryRaw.split(",")[0]?.trim() || "";

    const images = detail.images?.images || [];
    let imageUrl = images[0]?.origin || "";

    // If no image from Naver, try Kakao image search
    if (!imageUrl && detail.name) {
      try {
        const kakaoKey = process.env.KAKAO_REST_API_KEY || "";
        if (kakaoKey) {
          const q = encodeURIComponent(`${detail.name} ${neighborhood} 음식`);
          const kakaoRes = await fetch(
            `https://dapi.kakao.com/v2/search/image?query=${q}&size=1`,
            { cache: "no-store", headers: { Authorization: `KakaoAK ${kakaoKey}` } }
          );
          const kakaoData = await kakaoRes.json();
          imageUrl = kakaoData.documents?.[0]?.image_url || "";
        }
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      name: detail.name || "",
      region,
      neighborhood,
      category,
      naver_map_url: `https://map.naver.com/p/entry/place/${placeId}`,
      image_url: imageUrl,
    });
  } catch (err) {
    console.error("naver-place error:", err);
    return NextResponse.json(
      { error: "링크에서 정보를 가져올 수 없습니다: " + String(err) },
      { status: 500 }
    );
  }
}
