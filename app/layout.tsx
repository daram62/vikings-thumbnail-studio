import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vikings Thumbnail Studio",
  description: "Seoul Vikings floorball match thumbnail generator.",
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
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
