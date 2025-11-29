import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./components/ThemeProvider";
import LayoutClient from "./components/LayoutClient";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "LEXA IA - Assistente Inteligente",
    template: "%s | LEXA IA",
  },
  description: "Sistema inteligente de atendimento ao cliente com IA avançada",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable}`}>
      <body
        className={`${inter.className} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
      >
        <ThemeProvider>
          <LayoutClient>{children}</LayoutClient>
        </ThemeProvider>
      </body>
    </html>
  );
}
