"use client";

import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simular chamada API
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsLoading(false);
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Animated geometric background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-purple-600/20"></div>

        {/* Animated geometric shapes */}
        <div className="geometric-shape shape-1"></div>
        <div className="geometric-shape shape-2"></div>
        <div className="geometric-shape shape-3"></div>
        <div className="geometric-shape shape-4"></div>
        <div className="geometric-shape shape-5"></div>
        <div className="geometric-shape shape-6"></div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>

        {/* Light particles */}
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
      </div>

      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        {/* Card with logo */}
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full">
          <div className="text-center mb-10">
            {/* Logo with gradient background */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl blur-xl opacity-60"></div>
                <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl">
                  <img
                    src="/lexa-logo.png"
                    alt="LEXA IA Logo"
                    className="h-20 w-auto"
                  />
                </div>
              </div>
            </div>

            {/* Title and subtitle */}
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              LEXA IA
            </h1>
            <p className="text-gray-500 text-sm font-medium">
              Sua assistente virtual inteligente
            </p>
          </div>

          {!isSubmitted ? (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Esqueceu sua senha?
                </h2>
                <p className="text-gray-600">
                  Não se preocupe! Digite seu email e enviaremos instruções para
                  redefinir sua senha.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="seu@email.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-400 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    "Enviar Link de Recuperação"
                  )}
                </button>
              </form>

              {/* Voltar para Login */}
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para o login
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Success Message */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Email Enviado!
                </h2>
                <p className="text-gray-600 mb-6">
                  Enviamos um link de recuperação para <strong>{email}</strong>.
                  Verifique sua caixa de entrada e spam.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-900">
                    O link expira em 1 hora. Não recebeu o email?{" "}
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="font-semibold underline hover:no-underline"
                    >
                      Reenviar
                    </button>
                  </p>
                </div>

                <Link
                  href="/login"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para o login
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 mt-6 text-sm">
          © 2024 LEXA IA. Todos os direitos reservados.
        </p>
      </div>

      <style jsx>{`
        .geometric-shape {
          position: absolute;
          border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
          opacity: 0.15;
          filter: blur(40px);
        }

        .shape-1 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          top: -10%;
          left: -5%;
          animation: float 20s ease-in-out infinite;
        }

        .shape-2 {
          width: 350px;
          height: 350px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          top: 20%;
          right: -10%;
          animation: float 25s ease-in-out infinite reverse;
        }

        .shape-3 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          bottom: -5%;
          left: 10%;
          animation: float 30s ease-in-out infinite;
        }

        .shape-4 {
          width: 250px;
          height: 250px;
          background: linear-gradient(135deg, #6366f1, #3b82f6);
          bottom: 20%;
          right: 5%;
          animation: float 22s ease-in-out infinite reverse;
        }

        .shape-5 {
          width: 200px;
          height: 200px;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: pulse 15s ease-in-out infinite;
        }

        .shape-6 {
          width: 180px;
          height: 180px;
          background: linear-gradient(135deg, #a855f7, #4f46e5);
          top: 60%;
          left: 20%;
          animation: float 18s ease-in-out infinite;
        }

        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          opacity: 0.6;
        }

        .particle-1 {
          top: 20%;
          left: 30%;
          animation: twinkle 3s ease-in-out infinite;
        }

        .particle-2 {
          top: 60%;
          left: 70%;
          animation: twinkle 4s ease-in-out infinite 1s;
        }

        .particle-3 {
          top: 40%;
          left: 80%;
          animation: twinkle 3.5s ease-in-out infinite 0.5s;
        }

        .particle-4 {
          top: 80%;
          left: 40%;
          animation: twinkle 4.5s ease-in-out infinite 1.5s;
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            transform: translate(20px, -20px) rotate(5deg);
          }
          50% {
            transform: translate(-15px, 15px) rotate(-5deg);
          }
          75% {
            transform: translate(15px, 10px) rotate(3deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.15;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.25;
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }
      `}</style>
    </div>
  );
}
