'use client';

import { signIn } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
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
        router.push('/');
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
      {/* Enhanced animated geometric background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
        {/* Multiple gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 via-transparent to-purple-600/30"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-indigo-500/20 via-transparent to-blue-500/20"></div>

        {/* Primary animated geometric shapes - Layer 1 (largest) */}
        <div className="geometric-shape shape-1"></div>
        <div className="geometric-shape shape-2"></div>
        <div className="geometric-shape shape-3"></div>
        <div className="geometric-shape shape-4"></div>

        {/* Secondary shapes - Layer 2 (medium) */}
        <div className="geometric-shape shape-5"></div>
        <div className="geometric-shape shape-6"></div>
        <div className="geometric-shape shape-7"></div>
        <div className="geometric-shape shape-8"></div>

        {/* Tertiary shapes - Layer 3 (small) */}
        <div className="geometric-shape shape-9"></div>
        <div className="geometric-shape shape-10"></div>
        <div className="geometric-shape shape-11"></div>
        <div className="geometric-shape shape-12"></div>

        {/* Hexagonal pattern overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at center, transparent 0%, rgba(255,255,255,0.1) 2px, transparent 2px)`,
          backgroundSize: '60px 60px'
        }}></div>

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>

        {/* Glowing orbs */}
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div className="glow-orb orb-3"></div>

        {/* Enhanced light particles */}
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
        <div className="particle particle-4"></div>
        <div className="particle particle-5"></div>
        <div className="particle particle-6"></div>
        <div className="particle particle-7"></div>
        <div className="particle particle-8"></div>
      </div>

      {/* Login card */}
      <div className="relative z-10 bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
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
          animation: float 9s ease-in-out infinite;
        } 

        .shape-7 {
          width: 320px;
          height: 320px;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          bottom: 30%;
          left: 40%;
          animation: float 10s ease-in-out infinite;
        }

        .shape-8 {
          width: 290px;
          height: 290px;
          background: linear-gradient(135deg, #7c3aed, #8b5cf6);
          top: 60%;
          right: 20%;
          animation: pulse 9s ease-in-out infinite 2s;
        }

        .shape-9 {
          width: 200px;
          height: 200px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          top: 20%;
          left: 25%;
          animation: float 7s ease-in-out infinite;
        }

        .shape-10 {
          width: 180px;
          height: 180px;
          background: linear-gradient(135deg, #4f46e5, #3b82f6);
          top: 70%;
          left: 70%;
          animation: float 8s ease-in-out infinite reverse;
        }

        .shape-11 {
          width: 220px;
          height: 220px;
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          bottom: 40%;
          right: 35%;
          animation: pulse 7s ease-in-out infinite 1s;
        }

        .shape-12 {
          width: 190px;
          height: 190px;
          background: linear-gradient(135deg, #3b82f6, #7c3aed);
          top: 40%;
          right: 10%;
          animation: float 8s ease-in-out infinite reverse;
        }

        /* Glowing orbs */
        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.3;
          mix-blend-mode: screen;
        }

        .orb-1 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, #3b82f6, transparent);
          top: 20%;
          left: 10%;
          animation: glow-pulse 6s ease-in-out infinite;
        }

        .orb-2 {
          width: 250px;
          height: 250px;
          background: radial-gradient(circle, #8b5cf6, transparent);
          bottom: 20%;
          right: 15%;
          animation: glow-pulse 7s ease-in-out infinite 2s;
        }

        .orb-3 {
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, #6366f1, transparent);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: glow-pulse 8s ease-in-out infinite 1s;
        }

        .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(255,255,255,0.8);
        }

        .particle-1 {
          top: 15%;
          left: 20%;
          animation: twinkle 2s ease-in-out infinite;
        }

        .particle-2 {
          top: 25%;
          left: 80%;
          animation: twinkle 2.5s ease-in-out infinite 0.5s;
        }

        .particle-3 {
          top: 45%;
          left: 30%;
          animation: twinkle 2.2s ease-in-out infinite 1s;
        }

        .particle-4 {
          top: 65%;
          left: 70%;
          animation: twinkle 2.8s ease-in-out infinite 1.5s;
        }

        .particle-5 {
          top: 80%;
          left: 40%;
          animation: twinkle 2.3s ease-in-out infinite 0.8s;
        }

        .particle-6 {
          top: 35%;
          left: 90%;
          animation: twinkle 2.6s ease-in-out infinite 1.2s;
        }

        .particle-7 {
          top: 55%;
          left: 15%;
          animation: twinkle 2.4s ease-in-out infinite 0.3s;
        }

        .particle-8 {
          top: 90%;
          left: 60%;
          animation: twinkle 2.7s ease-in-out infinite 1.8s;
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

        @keyframes glow-pulse {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.2);
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
