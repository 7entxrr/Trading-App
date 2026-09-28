import { BottomNav } from "@/components/BottomNav";

export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="pb-[calc(76px+env(safe-area-inset-bottom))]">{children}</main>
      <BottomNav />
    </>
  );
}
