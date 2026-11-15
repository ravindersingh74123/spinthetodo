import type { Metadata } from "next";
import { Antonio, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import MarqueeBanner from "@/components/MarqueeBanner";
import { AppStateProvider } from "@/store/useAppState";

const antonio = Antonio({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-lateral-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-aeonik-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Spin the Wheel Todo",
  description: "Add today's tasks, spin the wheel, beat the timer, earn points and streaks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${antonio.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-paper-white text-carbon selection:bg-sunburst selection:text-carbon font-medium antialiased">
        <AppStateProvider>
          <MarqueeBanner />
          <Header />
          <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-6 sm:py-10">
            {children}
          </main>
        </AppStateProvider>
      </body>
    </html>
  );
}
