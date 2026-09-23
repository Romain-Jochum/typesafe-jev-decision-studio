import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TypeSafe Jev Studio | Decision Engine",
  description: "High-speed System One decision platform powered by TypeSafe Jev via OpenRouter.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico" }
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
