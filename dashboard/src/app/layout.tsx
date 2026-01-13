import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppLayout } from "@/components/app-layout";

/**
 * Custom fonts - more distinctive than default
 * Space Grotesk: Modern, geometric sans-serif for headings/body
 * JetBrains Mono: Monospace for code/numbers
 */
const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

/**
 * Page metadata - shown in browser tab and search results
 */
export const metadata: Metadata = {
  title: "Behavior Analytics | Dashboard",
  description: "User behavior analytics platform with LLM-powered insights",
};

/**
 * Root Layout - wraps ALL pages
 * 
 * Structure:
 * ┌────────────────────────────────────────┐
 * │ Providers (React Query)                │
 * │ ┌──────────┬─────────────────────────┐ │
 * │ │ Sidebar  │  Page Content           │ │
 * │ │ (fixed)  │  (scrollable)           │ │
 * │ │          │                         │ │
 * │ └──────────┴─────────────────────────┘ │
 * └────────────────────────────────────────┘
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased bg-slate-950 text-white`}
      >
        {/* Providers wrap everything - enables React Query in all pages */}
        <Providers>
          {/* AppLayout handles sidebar and route protection conditionally */}
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
