import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Geist_Mono, Nunito_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Expense Tracker",
    template: "%s | Expense Tracker",
  },
  description: "Personal expense tracker with a ledger-first accounting model.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/app-icon.svg",
    apple: "/icons/app-icon.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${nunitoSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="theme-pref-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var root = document.documentElement;
                  var color = localStorage.getItem("expense-theme-color");
                  var font = localStorage.getItem("expense-theme-font");
                  if (color) root.setAttribute("data-color-theme", color);
                  if (font) root.setAttribute("data-font-theme", font);
                } catch (error) {
                  console.warn("Unable to apply saved theme preferences.", error);
                }
              })();
            `,
          }}
        />
        {children}
      </body>
    </html>
  );
}
