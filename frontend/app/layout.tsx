import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: {
    default: "Phoenix Project",
    template: "",
  },
  description:
    "Live Arduino wildfire sensor network with real‑time map, AI decisions, and analytics.",
  applicationName: "Phoenix Project",
  authors: [{ name: "Phoenix Project Team" }],
  keywords: [
    "wildfire",
    "sensors",
    "arduino",
    "deck.gl",
    "react-map-gl",
    "nextjs",
    "aqi",
    "realtime",
  ],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  themeColor: "#0f172a",
  colorScheme: "light",
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Phoenix Project — Real‑Time Wildfire Sensor Map",
    description:
      "Live wildfire risk visualization with sensor telemetry, AI judge and analytics.",
    url: "https://your-domain.example",
    siteName: "Phoenix Project",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Phoenix Project Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Phoenix Project — Real‑Time Wildfire Sensor Map",
    description:
      "Live wildfire risk visualization with sensor telemetry, AI judge and analytics.",
    images: ["/og-image.png"],
    creator: "@phoenix_project",
  },
  metadataBase: new URL("https://your-domain.example"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
