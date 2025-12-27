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
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '617674611430743');
        fbq('track', 'PageView');
        `}} />
        <noscript dangerouslySetInnerHTML={{
          __html: `
        <img height="1" width="1" style="display:none"
        src="https://www.facebook.com/tr?id=617674611430743&ev=PageView&noscript=1"
        />
        `}} />
      </head>
      <body className="bg-gray-50 dark:bg-[#0a0a0f] transition-colors duration-300">
        <noscript dangerouslySetInnerHTML={{
          __html: `
        <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5ZGPB3RT"
          height="0" width="0"></iframe>
        `}} />
        <Providers>
          <LayoutClient>{children}</LayoutClient>
        </Providers>
      </body>
    </html>
  );
}
