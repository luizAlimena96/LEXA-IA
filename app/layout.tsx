import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LEXA IA",
  description: "Seu assistente de IA para atendimento ao cliente",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      {" "}
      <body className="bg-gray-100 text-gray-900 antialiased">
        {children}{" "}
      </body>{" "}
    </html>
  );
}
