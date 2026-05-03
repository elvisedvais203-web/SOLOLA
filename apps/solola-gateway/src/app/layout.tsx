import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Solola Gateway",
  description:
    "Porte d’entrée immersive — connecte-toi à l’expérience Solola.",
  applicationName: "Solola Gateway",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Solola Gateway",
    description:
      "Afrofuturisme, néon et fluidité — ta porte vers Solola.",
    type: "website",
    locale: "fr_FR",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0d",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#0D0D0D] font-sans text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
