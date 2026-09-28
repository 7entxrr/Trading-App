import { HomePositions } from "@/components/HomePositions";
import { HomeTop } from "@/components/HomeTop";

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100dvh-76px)] flex-col bg-[#131313]">
      <HomeTop />
      <section className="screen-in flex-1 rounded-t-[28px] bg-white px-5 pt-3 pb-6">
        <div className="mx-auto h-1 w-10 rounded-full bg-[#E7E7E7]" />
        <HomePositions />
      </section>
    </div>
  );
}
