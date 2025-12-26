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

// Force dynamic rendering to avoid SSR issues with browser APIs
export const dynamic = 'force-dynamic';

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
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-5ZGPB3RT')
        `}} />
      </head>
      <body className="bg-gray-50 dark:bg-[#0a0a0f] transition-colors duration-300">
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5ZGPB3RT"
          height="0" width="0"></iframe></noscript>
        <Providers>
          <LayoutClient>{children}</LayoutClient>
        </Providers>
      </body>
    </html>
  );
}
