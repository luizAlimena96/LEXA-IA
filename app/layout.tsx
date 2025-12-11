import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutClient from "./components/LayoutClient";
import { Providers } from "./providers";

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
  icons: {
    icon: "lexa-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 dark:bg-[#0a0a0f] transition-colors duration-300">
        <Providers>
          <LayoutClient>{children}</LayoutClient>
        </Providers>
      </body>
    </html>
  );
}
