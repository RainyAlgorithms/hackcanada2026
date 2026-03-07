import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PropertySeek — Find Homes Across Canada",
  description: "Explore 50+ verified Canadian real estate listings on an interactive 3D map. Filter by price, beds, and city.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
