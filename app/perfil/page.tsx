'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Building2, Wifi, WifiOff, QrCode, CheckCircle, Loader } from 'lucide-react';

export default function PerfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organization, setOrganization] = useState<any>(null);
  const [qrCode, setQrCode] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadOrganization();
    }
  }, [status, router]);

  const loadOrganization = async () => {
    try {
      const response = await fetch('/api/organizations', {
        credentials: 'include',
      });
      if (response.ok) {
        const orgs = await response.json();
        if (orgs.length > 0) {
          setOrganization(orgs[0]);
        }
      }
    } catch (error) {
      console.error('Error loading organization:', error);
    }
  };

  const handleConnect = async () => {
    if (!organization?.id) return;

    setConnecting(true);
    try {
      const response = await fetch(`/api/organizations/${organization.id}/whatsapp`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        // Start polling for connection
        startPolling();
      } else {
        alert('Erro ao gerar QR Code. Verifique a configuração Evolution API.');
      }
    } catch (error) {
      console.error('Error connecting WhatsApp:', error);
      alert('Erro ao conectar WhatsApp');
    } finally {
      setConnecting(false);
    }
  };

  const startPolling = () => {
    const interval = setInterval(async () => {
      await checkStatus();
    }, 3000);

    // Stop after 2 minutes
    setTimeout(() => clearInterval(interval), 120000);
  };

  const checkStatus = async () => {
    if (!organization?.id) return;

    setChecking(true);
    try {
      const response = await fetch(`/api/organizations/${organization.id}/whatsapp`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.connected) {
          setQrCode('');
          loadOrganization();
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleDisconnect = async () => {
    if (!organization?.id) return;
    if (!confirm('Deseja realmente desconectar o WhatsApp?')) return;

    try {
      const response = await fetch(`/api/organizations/${organization.id}/whatsapp`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        loadOrganization();
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Erro ao desconectar');
    }
  };

  if (status === 'loading' || !organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Perfil da Organização</h1>

      {/* Organization Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Building2 className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{organization.name}</h2>
            <p className="text-gray-600">/{organization.slug}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {organization.email && (
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{organization.email}</p>
            </div>
          )}
          {organization.phone && (
            <div>
              <p className="text-sm text-gray-500">Telefone</p>
              <p className="font-medium">{organization.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Connection */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Conexão WhatsApp</h3>

        {organization.whatsappConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">WhatsApp Conectado</p>
                {organization.whatsappPhone && (
                  <p className="text-sm text-green-700">Número: {organization.whatsappPhone}</p>
                )}
                {organization.whatsappConnectedAt && (
                  <p className="text-xs text-green-600">
                    Conectado em: {new Date(organization.whatsappConnectedAt).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Desconectar WhatsApp
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {!qrCode ? (
              <div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg mb-4">
                  <WifiOff className="w-6 h-6 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">WhatsApp Desconectado</p>
                    <p className="text-sm text-gray-600">
                      Conecte seu WhatsApp para começar a usar o sistema
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleConnect}
                  disabled={connecting || !organization.evolutionApiUrl}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connecting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Gerando QR Code...
                    </>
                  ) : (
                    <>
                      <Wifi className="w-5 h-5" />
                      Conectar WhatsApp
                    </>
                  )}
                </button>

                {!organization.evolutionApiUrl && (
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ Configuração Evolution API não encontrada. Entre em contato com o administrador.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <QrCode className="w-6 h-6 text-indigo-600" />
                  <h4 className="text-lg font-semibold text-gray-900">
                    Escaneie o QR Code
                  </h4>
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-indigo-200 inline-block mb-4">
                  <img
                    src={qrCode}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64"
                  />
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>1. Abra o WhatsApp no seu celular</p>
                  <p>2. Toque em Mais opções → Aparelhos conectados</p>
                  <p>3. Toque em Conectar um aparelho</p>
                  <p>4. Aponte seu celular para esta tela para escanear o código</p>
                </div>

                {checking && (
                  <div className="flex items-center justify-center gap-2 mt-4 text-indigo-600">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Aguardando conexão...</span>
                  </div>
                )}

                <button
                  onClick={() => setQrCode('')}
                  className="mt-4 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
