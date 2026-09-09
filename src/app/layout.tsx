import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#07090E",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "RapiEmail — Webmail Corporativo & Sovereign Suite",
  description: "Webmail corporativo de alta performance com inteligência artificial, sincronização instantânea e segurança de ponta a ponta.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RapiEmail",
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt"
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden antialiased bg-[#07090E]`}
    >
      <body className="h-screen w-full max-w-full overflow-hidden flex flex-col m-0 p-0 box-border bg-[#07090E] text-[#F4F4F6]">{children}</body>
    </html>
  );
}
