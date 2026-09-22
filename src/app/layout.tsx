import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Dapur Ina Aina",
    template: "%s | Dapur Ina Aina",
  },
  description:
    "Pesan makanan, menu tambahan, dan minuman dari Toko Dapur Ina Aina secara online, lengkap dengan pembayaran dan riwayat pesanan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${poppins.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-[family-name:var(--font-inter)]">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
