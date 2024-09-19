import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iM@S2 EDITOR",
  description: "iM@S2 EDITOR",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-cn">
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
