import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
  keywords: ["IA", "atendimento", "cliente", "chatbot", "automação"],
  authors: [{ name: "LEXA IA Team" }],
  creator: "LEXA IA",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    title: "LEXA IA - Assistente Inteligente",
    description:
      "Sistema inteligente de atendimento ao cliente com IA avançada",
    siteName: "LEXA IA",
  },
  twitter: {
    card: "summary_large_image",
    title: "LEXA IA - Assistente Inteligente",
    description:
      "Sistema inteligente de atendimento ao cliente com IA avançada",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <link rel="icon" href="/lexa.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#4F46E5" />
      </head>
      <body
        className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}
      >
        <div className="min-h-screen flex flex-col">{children}</div>

        {/* Script para analytics (opcional) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Exemplo de script de analytics
              if (typeof window !== 'undefined') {
                console.log('LEXA IA carregado com sucesso');
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
