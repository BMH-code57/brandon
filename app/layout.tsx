import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brandon Holda | The Cavern",
  description: "Explore Brandon Holda's work in cybersecurity, AI, and systems through an interactive cavern or a standard scrolling portfolio.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
