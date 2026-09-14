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
  themeColor: "#060911",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://rapiemail.online"),
  title: "RapiEmail — Webmail Corporativo & IA Executiva",
  description: "Webmail corporativo de alta performance com inteligência artificial soberana, sincronização instantânea e segurança de ponta a ponta.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RapiEmail",
  },
  openGraph: {
    title: "RapiEmail — Webmail Corporativo & IA Executiva",
    description: "Plataforma de Webmail corporativo de luxo com automação por inteligência artificial.",
    url: "https://rapiemail.online",
    siteName: "RapiEmail",
    images: [{ url: "/icon.svg" }],
    type: "website",
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt"
      className={`${geistSans.variable} ${geistMono.variable} h-full w-full m-0 p-0 overflow-hidden antialiased`}
      style={{ background: "radial-gradient(circle at 15% 15%, #0d1527 0%, #060911 100%)", backgroundColor: "#060911" }}
    >
      <body 
        className="h-full min-h-[100dvh] w-full min-w-full overflow-hidden flex flex-col m-0 p-0 box-border text-[#F4F4F6]"
        style={{ background: "radial-gradient(circle at 15% 15%, #0d1527 0%, #060911 100%)", backgroundColor: "#060911" }}
      >
        {children}
      </body>
    </html>
  );
}
