"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulação de login - em desenvolvimento, redireciona direto
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  };

  const handleDemoLogin = () => {
    setEmail("admin@lexa.com");
    setPassword("demo123");
    setIsLoading(true);

    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <main className="min-h-screen flex">
      {/* Lado Esquerdo - Formulário */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-br from-gray-50 to-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <span className="text-white text-2xl font-bold">L</span>
              <img
                className="absolute w-12 h-12"
                src="https://94c6933ae855c71b70260ade5358091d.cdn.bubble.io/cdn-cgi/image/w=48,h=48,f=auto,dpr=1,fit=contain/f1751010354585x726206709064529400/lexa%20foto.png"
                alt="Logo"
              />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              LEXA IA
            </h1>
            <p className="text-gray-600 mt-2">Seu assistente inteligente</p>
          </div>

          {/* Card do Formulário */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Bem-vindo de volta
              </h2>
              <p className="text-gray-600 mt-2">
                Entre na sua conta para continuar
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Campo Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  E-mail
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-400">📧</span>
                  </div>
                </div>
              </div>

              {/* Campo Senha */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              {/* Lembrar e Esqueci a Senha */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Lembrar-me</span>
                </label>
                <a
                  href="#"
                  className="text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Esqueceu a senha?
                </a>
              </div>

              {/* Botão de Login */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Entrando...
                  </>
                ) : (
                  "Entrar na conta"
                )}
              </button>
            </form>

            {/* Divisor */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Ou</span>
                </div>
              </div>

              {/* Botão de Demo */}
              <button
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Acessando Demo...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🚀</span>
                    Acesso Rápido (Demo)
                  </>
                )}
              </button>
            </div>

            {/* Rodapé do Form */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Não tem uma conta?{" "}
                <a
                  href="#"
                  className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Solicitar acesso
                </a>
              </p>
            </div>
          </div>

          {/* Informações de Demo */}
          <div className="mt-8 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Modo Desenvolvimento:</strong> Use qualquer e-mail/senha
                ou clique em "Acesso Rápido"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Banner/Ilustração */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>

        {/* Conteúdo do Banner */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold mb-6">
              Potencialize seu{" "}
              <span className="text-cyan-300">Atendimento</span>
            </h2>
            <p className="text-xl text-indigo-100 mb-8 leading-relaxed">
              Com a LEXA IA, transforme a experiência do seu cliente através de
              atendimento inteligente e personalizado.
            </p>

            {/* Lista de Benefícios */}
            <div className="space-y-4">
              {[
                {
                  icon: "🤖",
                  text: "IA Inteligente para respostas automáticas",
                },
                { icon: "💬", text: "Atendimento multicanal integrado" },
                { icon: "📊", text: "Relatórios detalhados em tempo real" },
                { icon: "⭐", text: "Análise de satisfação do cliente" },
              ].map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-2xl">{benefit.icon}</span>
                  <span className="text-indigo-100">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Elementos Decorativos */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-300 opacity-10 rounded-full translate-y-48 -translate-x-48"></div>
      </div>
    </main>
  );
}
