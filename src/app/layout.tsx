import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthGate } from "@/components/AuthGate";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gold Trading",
  description: "Trade and track gold (XAU/USD).",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Trading" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#131313",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} antialiased`}>
      <body>
        {/* Phone-width app column; on desktop it sits centred on a grey backdrop. */}
        <div className="relative mx-auto min-h-dvh max-w-[430px] overflow-x-clip bg-white">
          <AuthGate>{children}</AuthGate>
        </div>
      </body>
    </html>
  );
}
