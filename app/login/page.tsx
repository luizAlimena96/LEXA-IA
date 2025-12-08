'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('lexa_user_email');
    const savedPassword = localStorage.getItem('lexa_user_password');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    if (savedPassword) {
      setPassword(atob(savedPassword));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (rememberMe) {
        localStorage.setItem('lexa_user_email', email);
        localStorage.setItem('lexa_user_password', btoa(password));
      } else {
        localStorage.removeItem('lexa_user_email');
        localStorage.removeItem('lexa_user_password');
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Email ou senha inválidos');
      } else {
        // Preserve organizationId parameter if present in URL
        const organizationId = searchParams.get('organizationId');
        if (organizationId) {
          router.push(`/?organizationId=${organizationId}`);
        } else {
          router.push('/');
        }
        router.refresh();
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
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

      {/* Login card with Liquid Glass effect */}
      <div className="liquid-glass-card relative z-10 p-8 rounded-3xl w-full max-w-md">
        <div className="text-center mb-10">
          {/* Logo with Liquid Glass effect */}
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            LEXA IA
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Sua assistente virtual inteligente
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Lembrar de mim
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/esqueceu-senha"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Esqueceu sua senha?
          </a>
        </div>
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
