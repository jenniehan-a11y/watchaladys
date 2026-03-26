import Link from "next/link";
import SojuBottle from "@/components/SojuBottle";

export default function Home() {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-[#2D5016]">
      <Link href="/restaurants" aria-label="맛집 목록으로 이동">
        <SojuBottle />
      </Link>
    </main>
  );
}
