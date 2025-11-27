"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 2000);

    // Animação de progresso
    const progressTimer = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 10;
      });
    }, 150);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [router]);

  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center">
        {/* Logo Animada */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
              <span className="text-white text-2xl font-bold">L</span>
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-200 to-purple-300 rounded-2xl blur opacity-75 animate-pulse"></div>
          </div>
        </div>

        {/* Texto e Loading */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
              LEXA IA
            </h1>
            <p className="text-gray-600 text-lg">
              Seu assistente inteligente para atendimento ao cliente
            </p>
          </div>

          {/* Barra de Progresso */}
          <div className="w-64 mx-auto">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Inicializando...</span>
              <span>{loadingProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Loading Dots */}
          <div className="flex justify-center space-x-2">
            {[0, 1, 2].map((dot) => (
              <div
                key={dot}
                className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                style={{ animationDelay: `${dot * 0.1}s` }}
              ></div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400">
            Carregando sua experiência personalizada...
          </p>
        </div>
      </div>
    </main>
  );
}
