import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/common/ToastContainer";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Open Samguk",
  description: "A modern strategy game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="font-sans antialiased">
        <ToastProvider>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
