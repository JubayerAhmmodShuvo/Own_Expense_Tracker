import type { Metadata } from "next";
import { Spline_Sans_Mono, Sofia_Sans_Condensed } from "next/font/google";
import Providers from "@/components/Providers";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const splineSansMono = Spline_Sans_Mono({
  variable: "--font-spline-sans-mono",
  subsets: ["latin"],
  weight: ["400"],
});

const sofiaSansCondensed = Sofia_Sans_Condensed({
  variable: "--font-sofia-sans-condensed",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Expense Tracker - Manage Your Finances",
  description: "Track your daily expenses and income with detailed analytics and insights",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Expense Tracker",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${splineSansMono.variable} ${sofiaSansCondensed.variable} antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        <Providers>
          <ToastProvider>
            {children}
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
