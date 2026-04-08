import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: "Quản Lý Bán Heo",
  description: "Ứng dụng quản lý bán heo - Pig Sales Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased">
      <body className="min-h-full bg-gray-50">
        <Header />
        <div className="mx-auto max-w-lg lg:max-w-4xl xl:max-w-6xl min-h-full bg-white shadow-lg">
          <main className="pt-14 pb-20 px-4 py-4">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
