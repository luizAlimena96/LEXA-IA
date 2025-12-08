'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function HomePage() {
  const router = useRouter();
  const { status, data: session } = useSession();
  const [error, setError] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    console.log('[HomePage] Session status:', status);
    console.log('[HomePage] Session data:', session);

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('[HomePage] Timeout reached after 10 seconds');
      setTimeoutReached(true);

      // If we're authenticated but still here, force redirect to dashboard
      if (status === 'authenticated') {
        console.log('[HomePage] Force redirecting to dashboard');
        router.replace('/dashboard');
      } else if (status === 'loading') {
        console.log('[HomePage] Still loading after timeout, showing error');
        setError(true);
      }
    }, 10000); // 10 second timeout

    // Only redirect after session is loaded
    if (status === 'loading') {
      console.log('[HomePage] Session is loading...');
      return () => clearTimeout(timeout);
    }

    if (status === 'unauthenticated') {
      console.log('[HomePage] User is unauthenticated, redirecting to login');
      clearTimeout(timeout);
      router.replace('/login');
    } else if (status === 'authenticated') {
      console.log('[HomePage] User is authenticated, redirecting to dashboard');
      clearTimeout(timeout);
      router.replace('/dashboard');
    }

    return () => clearTimeout(timeout);
  }, [status, router, session]);

  // Show error state if timeout reached and still loading
  if (error || (timeoutReached && status === 'loading')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Erro ao carregar
            </h2>
            <p className="text-red-600 mb-4">
              Não foi possível verificar sua sessão. Por favor, tente novamente.
            </p>
            <button
              onClick={() => {
                setError(false);
                setTimeoutReached(false);
                router.refresh();
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while checking auth
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando...</p>
        {timeoutReached && (
          <p className="mt-2 text-sm text-gray-500">
            Redirecionando para o dashboard...
          </p>
        )}
      </div>
    </div>
  );
}
