import type { Metadata } from "next";
import { Noto_Sans_SC } from 'next/font/google'
import "./globals.css";

export const metadata: Metadata = {
  title: "iM@S2 EDITOR",
  description: "iM@S2 EDITOR",
};

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-cn">
      <body
        className={notoSansSC.className}
      >
        {children}
      </body>
    </html>
  );
}
