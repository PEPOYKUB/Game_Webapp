import type { Metadata } from "next";
import { Noto_Sans_Thai, Poppins } from "next/font/google";
import "./globals.css";

const thai = Noto_Sans_Thai({ subsets: ["thai"], variable: "--font-thai", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  title: "CyberEscape KKU",
  description: "Security awareness escape room for KKU students",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body className={`${thai.variable} ${poppins.variable}`}>{children}</body></html>;
}
