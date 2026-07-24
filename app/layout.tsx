import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Figtree, Geist_Mono, Lora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "presentpo",
  description: "Classroom QR attendance for CTADWEBL sections",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased font-sans",
        figtree.variable,
        plusJakartaSans.variable,
        lora.variable,
        geistMono.variable,
      )}
    >
      <body className="flex min-h-full flex-col font-sans">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
