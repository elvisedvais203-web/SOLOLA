import type { Metadata } from "next";
import "../styles/globals.css";
import { AppShell } from "../components/AppShell";

export const metadata: Metadata = {
  title: "Solola",
  description: "Une application qui vous appartient, pour parler, partager et vous connecter a votre facon.",
  metadataBase: new URL("https://nextalk.app"),
  icons: {
    icon: [
      { url: "/branding/nexttalk-icon-192-tight.png", sizes: "192x192", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/branding/apple-touch-icon.png", sizes: "180x180", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/branding/nexttalk-icon-512-tight.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/branding/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: [
      { url: "/branding/nexttalk-icon-192-tight.png", media: "(prefers-color-scheme: dark)" },
      { url: "/branding/apple-touch-icon.png", media: "(prefers-color-scheme: light)" }
    ]
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
