"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(
        "https://webhook1.lexa-ia.com/webhook/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const result = await response.json();

      if (!result.success)
        return alert(result.message || "Credenciais inválidas");

      if (result.token) {
        localStorage.setItem("token", result.token);
      }

      router.push("/dashboard");
    } catch (error) {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden">
      {/* BACKGROUND ANIMADO */}
      <div className="absolute inset-0 -z-10 animate-bg">
        <div className="w-full h-full bg-gradient-to-br from-indigo-600/40 via-purple-600/40 to-pink-500/40 dark:from-indigo-900/40 dark:via-purple-900/40 dark:to-pink-800/40 blur-3xl opacity-70"></div>
      </div>

      {/* COLUNA FORM */}
      <div className="flex items-center justify-center p-8 lg:p-20">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700 backdrop-blur-lg">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src="https://94c6933ae855c71b70260ade5358091d.cdn.bubble.io/f1751010354585x726206709064529400/lexa%20foto.png"
              className="w-16 h-16 mx-auto"
            />
            <h1 className="text-3xl font-bold mt-4 text-gray-900 dark:text-gray-100">
              LEXA IA
            </h1>
            <p className="text-gray-500 dark:text-gray-300">
              Seu assistente inteligente
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                E-mail
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  mt-2 w-full px-4 py-3 rounded-lg border 
                  border-gray-300 dark:border-gray-700
                  focus:ring-2 focus:ring-indigo-500 focus:outline-none
                  bg-gray-50 dark:bg-gray-900
                  text-gray-900 dark:text-gray-100
                "
              />
            </div>

            {/* Senha */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Senha
              </label>

              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                    w-full px-4 py-3 rounded-lg border 
                    border-gray-300 dark:border-gray-700
                    focus:ring-2 focus:ring-indigo-500
                    bg-gray-50 dark:bg-gray-900
                    text-gray-900 dark:text-gray-100
                    pr-12
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500 dark:text-gray-300"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <input type="checkbox" className="w-4 h-4" />
                Lembrar-me
              </label>

              <button
                type="button"
                onClick={() => router.push("/recuperar-senha")}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full py-3 rounded-lg font-semibold text-white
                bg-indigo-600 hover:bg-indigo-700
                dark:bg-indigo-700 dark:hover:bg-indigo-600
                shadow-md hover:shadow-lg transition-all
                disabled:opacity-50 flex items-center justify-center gap-2
              "
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* COLUNA DIREITA */}
      <div className="hidden lg:flex items-center justify-center text-white relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700/50 via-purple-700/50 to-purple-900/50"></div>
      </div>
    </main>
  );
}
