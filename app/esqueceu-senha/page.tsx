"use client";

import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar email');
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Erro ao enviar email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Parallax background with modern image */}
      <div className="parallax-bg"></div>

      {/* Gaussian blur overlay */}
      <div className="blur-overlay"></div>

      {/* Animated gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-indigo-900/20 to-purple-900/30 z-[1]"></div>

      {/* Floating particles for modern effect */}
      <div className="absolute inset-0 z-[2] overflow-hidden">
        <div className="floating-particle particle-1"></div>
        <div className="floating-particle particle-2"></div>
        <div className="floating-particle particle-3"></div>
        <div className="floating-particle particle-4"></div>
        <div className="floating-particle particle-5"></div>
        <div className="floating-particle particle-6"></div>
      </div>

      {/* Content container */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        {/* Card with Liquid Glass effect */}
        <div className="liquid-glass-card p-8 rounded-3xl w-full">
          <div className="text-center mb-10">
            {/* Logo with gradient background - Centralizada */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-2xl blur-xl opacity-60"></div>
                <div className="logo-glass-container relative p-4 rounded-2xl">
                  <img
                    src="/lexa-logo.png"
                    alt="LEXA IA Logo"
                    className="h-20 w-auto relative z-10"
                  />
                </div>
              </div>
            </div>

            {/* Title and subtitle */}
            <h1 className="text-3xl font-bold mb-2">
              LEXA IA
            </h1>
            <p className="text-sm font-medium">
              Sua assistente virtual inteligente
            </p>
          </div>

          {!isSubmitted ? (
            <>
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 glass-icon-bg rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-300" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Esqueceu sua senha?
                </h2>
                <p className="text-slate-300">
                  Não se preocupe! Digite seu email e enviaremos instruções para
                  redefinir sua senha.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
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
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-400 text-white py-3 rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-indigo-500/25"
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
                  className="inline-flex items-center font-medium transition-colors text-[#93C5FD]"
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
                <div className="w-16 h-16 glass-success-bg rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Email Enviado!
                </h2>
                <p className="text-slate-300 mb-6">
                  Enviamos um link de recuperação para <strong className="text-white">{email}</strong>.
                  Verifique sua caixa de entrada e spam.
                </p>

                <div className="glass-info-box rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-200">
                    O link expira em 1 hora. Não recebeu o email?{" "}
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="font-semibold underline hover:no-underline text-blue-300"
                    >
                      Reenviar
                    </button>
                  </p>
                </div>

                <Link
                  href="/login"
                  className="inline-flex items-center font-medium transition-colors text-white hover:text-blue-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para o login
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 mt-6 text-sm">
          © 2025 LEXA IA. Todos os direitos reservados.
        </p>
      </div>

      <style jsx>{`
        /* Parallax Background with Image */
        .parallax-bg {
          position: absolute;
          inset: 0;
          background-image: url('/login-bg-modern.jpg');
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
          transform: scale(1.1);
          animation: subtle-zoom 30s ease-in-out infinite alternate;
        }

        /* Gaussian Blur Overlay - 15% darker for better contrast */
        .blur-overlay {
          position: absolute;
          inset: 0;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          background: rgba(15, 23, 42, 0.57);
        }

        /* Liquid Glass effect for Logo container */
        .logo-glass-container {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.25) 0%,
            rgba(255, 255, 255, 0.15) 50%,
            rgba(255, 255, 255, 0.1) 100%
          );
          backdrop-filter: blur(12px) saturate(150%);
          -webkit-backdrop-filter: blur(12px) saturate(150%);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        /* Liquid Glass Card Effect */
        .liquid-glass-card {
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.25) 0%,
            rgba(255, 255, 255, 0.1) 50%,
            rgba(255, 255, 255, 0.05) 100%
          );
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            inset 0 -1px 0 rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
        }

        .liquid-glass-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -50%;
          width: 200%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          animation: liquid-shine 8s ease-in-out infinite;
        }

        .liquid-glass-card::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(
            45deg,
            rgba(99, 102, 241, 0.3),
            rgba(139, 92, 246, 0.2),
            rgba(99, 102, 241, 0.3)
          );
          border-radius: inherit;
          z-index: -1;
          filter: blur(15px);
          opacity: 0.5;
        }

        /* Glass Icon Backgrounds */
        .glass-icon-bg {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.2));
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .glass-success-bg {
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(22, 163, 74, 0.2));
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .glass-info-box {
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        /* Floating Particles */
        .floating-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
        }

        .floating-particle.particle-1 {
          top: 10%;
          left: 15%;
          animation: float-particle 12s ease-in-out infinite;
        }

        .floating-particle.particle-2 {
          top: 20%;
          right: 20%;
          animation: float-particle 15s ease-in-out infinite 2s;
        }

        .floating-particle.particle-3 {
          top: 60%;
          left: 10%;
          animation: float-particle 18s ease-in-out infinite 4s;
        }

        .floating-particle.particle-4 {
          bottom: 30%;
          right: 15%;
          animation: float-particle 14s ease-in-out infinite 1s;
        }

        .floating-particle.particle-5 {
          top: 40%;
          left: 85%;
          animation: float-particle 16s ease-in-out infinite 3s;
        }

        .floating-particle.particle-6 {
          bottom: 20%;
          left: 40%;
          animation: float-particle 20s ease-in-out infinite 5s;
        }

        /* Animations */
        @keyframes subtle-zoom {
          0% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1.15);
          }
        }

        @keyframes liquid-shine {
          0% {
            left: -200%;
          }
          50%, 100% {
            left: 200%;
          }
        }

        @keyframes float-particle {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          25% {
            transform: translate(30px, -20px) scale(1.2);
            opacity: 1;
          }
          50% {
            transform: translate(-20px, 30px) scale(0.8);
            opacity: 0.4;
          }
          75% {
            transform: translate(15px, 15px) scale(1.1);
            opacity: 0.8;
          }
        }

        /* Glass effect for form elements inside the card */
        .liquid-glass-card input {
          background: rgba(255, 255, 255, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.5) !important;
          color: #1f2937 !important;
        }

        .liquid-glass-card input::placeholder {
          color: #6b7280 !important;
        }

        .liquid-glass-card input:focus {
          background: rgba(255, 255, 255, 0.95) !important;
          border-color: rgba(99, 102, 241, 0.5) !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
        }

        .liquid-glass-card label {
          color: #f1f5f9 !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .liquid-glass-card h1 {
          color: white !important;
          background: linear-gradient(135deg, #60a5fa, #a78bfa) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          text-shadow: none;
        }

        .liquid-glass-card p {
          color: rgba(226, 232, 240, 0.9) !important;
        }

        .liquid-glass-card a {
          color: #93c5fd !important;
        }

        .liquid-glass-card a:hover {
          color: #bfdbfe !important;
        }
      `}</style>
    </div>
  );
}
