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
  themeColor: "#1A73E8",
};

export const metadata: Metadata = {
  title: "RapiEmail — Webmail Corporativo & Sovereign Suite",
  description: "Webmail corporativo de alta performance com inteligência artificial, sincronização instantânea e segurança de ponta a ponta.",
  icons: {
    icon: "/favicon.ico",
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt"
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden antialiased light`}
    >
      <body className="h-screen w-screen overflow-hidden flex flex-col m-0 p-0">{children}</body>
    </html>
  );
}
