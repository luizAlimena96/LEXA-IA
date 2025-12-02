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

  useEffect(() => {
    const savedEmail = localStorage.getItem('lexa_user_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (rememberMe) {
        localStorage.setItem('lexa_user_email', email);
      } else {
        localStorage.removeItem('lexa_user_email');
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background waves */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>

      {/* Login card */}
      <div className="relative z-10 bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">LEXA IA</h1>
          <p className="text-gray-600">Sistema Multi-Tenant</p>
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
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
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
        .wave {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 200%;
          height: 200px;
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.1), rgba(99, 102, 241, 0.1));
          border-radius: 1000px 1000px 0 0;
          animation: wave 15s linear infinite;
        }

        .wave1 {
          animation-duration: 20s;
          opacity: 0.3;
        }

        .wave2 {
          animation-duration: 25s;
          opacity: 0.2;
          animation-delay: -5s;
        }

        .wave3 {
          animation-duration: 30s;
          opacity: 0.1;
          animation-delay: -10s;
        }

        @keyframes wave {
          0% {
            transform: translateX(0) translateY(0);
          }
          50% {
            transform: translateX(-25%) translateY(10px);
          }
          100% {
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
