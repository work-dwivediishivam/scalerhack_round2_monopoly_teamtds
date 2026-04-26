import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "OpenMonopoly India",
  description:
    "Three-agent Monopoly RL environment with Indian city names, OpenEnv backend, and a Vercel-ready replay board.",
};

const className = `${spaceGrotesk.variable} ${plexMono.variable} h-full antialiased`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={className}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
