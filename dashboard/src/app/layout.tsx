import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { Providers } from "@/components/providers";

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
          {/* Fixed sidebar on the left */}
          <Sidebar />
          
          {/* Main content area - offset by sidebar width (ml-64 = margin-left: 256px) */}
          <main className="ml-64 min-h-screen">
            <div className="p-8">
              {children}
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
