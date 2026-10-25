import type React from "react";
import type { Metadata, Viewport } from "next";
import { Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";
import { AppWrapper } from "@/components/app-wrapper";
import { GameProvider } from "@/contexts/game-context";
import { TranslateLayer } from "@/components/translate-layer";
import { Toaster } from "sonner";
import "./globals.css";

const notoSans = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans",
  display: "swap",
  preload: false,
});

const notoSerif = Noto_Serif_TC({
  subsets: ["latin"],
  weight: ["600", "900"],
  variable: "--font-noto-serif",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Made with App Studio",
  description:
    "City's Games(2): historical arcade adventures where every choice changes the battle.",
    generator: 'v0.app'
};

export const viewport: Viewport = {
  themeColor: "#12222b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      className={`${notoSans.variable} ${notoSerif.variable} bg-background`}
    >
      <body className="font-sans antialiased">
        <AppWrapper>
          <GameProvider>
              {children}
              <TranslateLayer />
            </GameProvider>
        </AppWrapper>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
