'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useOrganization } from '@/app/contexts/OrganizationContext';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { selectedOrgId } = useOrganization();
  const [error, setError] = useState(false);
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('[HomePage] Timeout reached after 10 seconds');
      setTimeoutReached(true);

      // If we're authenticated but still here, force redirect to dashboard
      if (user && selectedOrgId) {
        console.log('[HomePage] Force redirecting to dashboard');
        router.replace('/dashboard');
      } else if (loading) {
        console.log('[HomePage] Still loading after timeout, showing error');
        setError(true);
      }
    }, 10000); // 10 second timeout

    if (loading) {
      console.log('[HomePage] Auth is loading...');
      return () => clearTimeout(timeout);
    }

    if (!user) {
      console.log('[HomePage] User is unauthenticated, redirecting to login');
      clearTimeout(timeout);
      router.replace('/login');
    } else if (user && selectedOrgId) {
      console.log('[HomePage] User is authenticated and organization selected, redirecting to dashboard');
      clearTimeout(timeout);
      router.replace('/dashboard');
    } else if (user && !selectedOrgId) {
      console.log('[HomePage] User is authenticated but no organization selected, redirecting to organization selection');
      clearTimeout(timeout);
      router.replace('/select-organization');
    }

    return () => clearTimeout(timeout);
  }, [user, loading, router, selectedOrgId]);

  // Show error state if timeout reached and still loading
  if (error || (timeoutReached && loading)) {
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando...</p>
        {timeoutReached && (
          <p className="mt-2 text-sm text-gray-500">
            Redirecionando para o dashboard...
          </p>
        )}
      </div>

      {/* Privacy Policy link - required by Google verification */}
      <div className="absolute bottom-4 text-center">
        <a
          href="/terms"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Política de Privacidade
        </a>
      </div>
    </div>
  );
}
