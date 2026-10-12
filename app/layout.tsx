import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "SJACM | St John’s Anglican Church, Makurdi",
  description:
    "Church registry, activities and announcements for St John’s Anglican Church, Makurdi, Church of Nigeria (Anglican Communion).",
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
