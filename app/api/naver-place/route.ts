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

    // 주소에서 동/읍/리/로까지만 추출 (번지 제외), 구 포함
    // "경기도 부천시 원미구 중동 123" → "부천시 원미구 중동"
    // "서울특별시 마포구 합정동 123" → "마포구 합정동"
    const neighborParts = addressParts.slice(1);
    const dongIdx = neighborParts.findIndex((p: string) => /[동읍리로길]$/.test(p));
    const neighborhood = dongIdx >= 0
      ? neighborParts.slice(0, dongIdx + 1).join(" ")
      : neighborParts.slice(0, 3).join(" ");

    const categoryRaw = detail.category?.category || "";
    const category = categoryRaw.split(",")[0]?.trim() || "";

    // 항상 카카오CDN 썸네일 사용 (네이버/외부 이미지는 브라우저에서 차단됨)
    let imageUrl = "";
    try {
      const kakaoKey = process.env.KAKAO_REST_API_KEY || "";
      if (kakaoKey && detail.name) {
        const q = encodeURIComponent(`${detail.name} ${neighborhood} 맛집`);
        const kakaoRes = await fetch(
          `https://dapi.kakao.com/v2/search/image?query=${q}&size=1`,
          { cache: "no-store", headers: { Authorization: `KakaoAK ${kakaoKey}` } }
        );
        const kakaoData = await kakaoRes.json();
        imageUrl = kakaoData.documents?.[0]?.thumbnail_url || "";
      }
    } catch {
      // ignore
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
