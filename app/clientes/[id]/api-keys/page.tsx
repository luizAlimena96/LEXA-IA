'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function ApiKeysPage() {
    const params = useParams();
    const orgId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [organization, setOrganization] = useState<any>(null);

    const [config, setConfig] = useState({
        openaiApiKey: '',
        openaiModel: 'gpt-4o-mini',
        elevenLabsApiKey: '',
        elevenLabsVoiceId: '',
        elevenLabsModel: 'eleven_multilingual_v2',
        evolutionApiUrl: '',
        evolutionApiKey: '',
        evolutionInstanceName: '',
        zapSignApiToken: '',
        zapSignTemplateId: '',
    });

    const [showKeys, setShowKeys] = useState({
        openai: false,
        elevenlabs: false,
        evolution: false,
        zapsign: false,
    });

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const res = await fetch(`/api/organizations/${orgId}`);
            const data = await res.json();
            setOrganization(data);

            setConfig({
                openaiApiKey: data.openaiApiKey || '',
                openaiModel: data.openaiModel || 'gpt-4o-mini',
                elevenLabsApiKey: data.elevenLabsApiKey || '',
                elevenLabsVoiceId: data.elevenLabsVoiceId || '',
                elevenLabsModel: data.elevenLabsModel || 'eleven_multilingual_v2',
                evolutionApiUrl: data.evolutionApiUrl || '',
                evolutionApiKey: data.evolutionApiKey || '',
                evolutionInstanceName: data.evolutionInstanceName || '',
                zapSignApiToken: data.zapSignApiToken || '',
                zapSignTemplateId: data.zapSignTemplateId || '',
            });
        } catch (error) {
            console.error('Error loading config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch(`/api/organizations/${orgId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            alert('✅ API Keys salvas com sucesso!');
        } catch (error) {
            console.error('Error saving:', error);
            alert('❌ Erro ao salvar API Keys');
        } finally {
            setSaving(false);
        }
    };

    const testOpenAI = async () => {
        if (!config.openaiApiKey) {
            alert('Configure a API Key primeiro');
            return;
        }

        try {
            const res = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    Authorization: `Bearer ${config.openaiApiKey}`,
                },
            });

            if (res.ok) {
                alert('✅ OpenAI API Key válida!');
            } else {
                alert('❌ OpenAI API Key inválida');
            }
        } catch (error) {
            alert('❌ Erro ao testar OpenAI');
        }
    };

    const testElevenLabs = async () => {
        if (!config.elevenLabsApiKey) {
            alert('Configure a API Key primeiro');
            return;
        }

        try {
            const res = await fetch('https://api.elevenlabs.io/v1/voices', {
                headers: {
                    'xi-api-key': config.elevenLabsApiKey,
                },
            });

            if (res.ok) {
                alert('✅ ElevenLabs API Key válida!');
            } else {
                alert('❌ ElevenLabs API Key inválida');
            }
        } catch (error) {
            alert('❌ Erro ao testar ElevenLabs');
        }
    };

    if (loading) return <div className="p-8">Carregando...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">🔑 API Keys</h1>
                    <p className="text-gray-600 mt-1">
                        Configure as chaves de API específicas para {organization?.name}
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? 'Salvando...' : '💾 Salvar'}
                </button>
            </div>

            {/* OpenAI */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                        🤖
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">OpenAI</h2>
                        <p className="text-sm text-gray-600">GPT-4, GPT-3.5, Whisper, Vision</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">API Key</label>
                        <div className="flex gap-2">
                            <input
                                type={showKeys.openai ? 'text' : 'password'}
                                value={config.openaiApiKey}
                                onChange={(e) => setConfig({ ...config, openaiApiKey: e.target.value })}
                                className="flex-1 p-3 border rounded-lg font-mono text-sm"
                                placeholder="sk-..."
                            />
                            <button
                                onClick={() => setShowKeys({ ...showKeys, openai: !showKeys.openai })}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                {showKeys.openai ? '🙈' : '👁️'}
                            </button>
                            <button
                                onClick={testOpenAI}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                🧪 Testar
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Obtenha em:{' '}
                            <a
                                href="https://platform.openai.com/api-keys"
                                target="_blank"
                                className="text-blue-600 hover:underline"
                            >
                                platform.openai.com/api-keys
                            </a>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Modelo Padrão</label>
                        <select
                            value={config.openaiModel}
                            onChange={(e) => setConfig({ ...config, openaiModel: e.target.value })}
                            className="w-full p-3 border rounded-lg"
                        >
                            <option value="gpt-4o">GPT-4o (Mais recente)</option>
                            <option value="gpt-4o-mini">GPT-4o Mini (Recomendado - Rápido e barato)</option>
                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Mais barato)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ElevenLabs */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                        🎙️
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">ElevenLabs</h2>
                        <p className="text-sm text-gray-600">Text-to-Speech (Áudio)</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">API Key</label>
                        <div className="flex gap-2">
                            <input
                                type={showKeys.elevenlabs ? 'text' : 'password'}
                                value={config.elevenLabsApiKey}
                                onChange={(e) =>
                                    setConfig({ ...config, elevenLabsApiKey: e.target.value })
                                }
                                className="flex-1 p-3 border rounded-lg font-mono text-sm"
                                placeholder="..."
                            />
                            <button
                                onClick={() =>
                                    setShowKeys({ ...showKeys, elevenlabs: !showKeys.elevenlabs })
                                }
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                {showKeys.elevenlabs ? '🙈' : '👁️'}
                            </button>
                            <button
                                onClick={testElevenLabs}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                🧪 Testar
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Obtenha em:{' '}
                            <a
                                href="https://elevenlabs.io/app/settings/api-keys"
                                target="_blank"
                                className="text-blue-600 hover:underline"
                            >
                                elevenlabs.io/app/settings/api-keys
                            </a>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Voice ID Padrão</label>
                        <input
                            type="text"
                            value={config.elevenLabsVoiceId}
                            onChange={(e) => setConfig({ ...config, elevenLabsVoiceId: e.target.value })}
                            className="w-full p-3 border rounded-lg font-mono text-sm"
                            placeholder="21m00Tcm4TlvDq8ikWAM (Rachel)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Encontre em:{' '}
                            <a
                                href="https://elevenlabs.io/app/voice-library"
                                target="_blank"
                                className="text-blue-600 hover:underline"
                            >
                                elevenlabs.io/app/voice-library
                            </a>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Modelo de Voz</label>
                        <select
                            value={config.elevenLabsModel}
                            onChange={(e) => setConfig({ ...config, elevenLabsModel: e.target.value })}
                            className="w-full p-3 border rounded-lg"
                        >
                            <option value="eleven_multilingual_v2">
                                Multilingual V2 (Recomendado - Português)
                            </option>
                            <option value="eleven_monolingual_v1">Monolingual V1 (Inglês)</option>
                            <option value="eleven_turbo_v2">Turbo V2 (Mais rápido)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Evolution API */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                        💬
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Evolution API</h2>
                        <p className="text-sm text-gray-600">Integração WhatsApp</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">URL da API</label>
                        <input
                            type="text"
                            value={config.evolutionApiUrl}
                            onChange={(e) => setConfig({ ...config, evolutionApiUrl: e.target.value })}
                            className="w-full p-3 border rounded-lg"
                            placeholder="https://api.evolution.com.br"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">API Key</label>
                        <div className="flex gap-2">
                            <input
                                type={showKeys.evolution ? 'text' : 'password'}
                                value={config.evolutionApiKey}
                                onChange={(e) => setConfig({ ...config, evolutionApiKey: e.target.value })}
                                className="flex-1 p-3 border rounded-lg font-mono text-sm"
                                placeholder="..."
                            />
                            <button
                                onClick={() => setShowKeys({ ...showKeys, evolution: !showKeys.evolution })}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                {showKeys.evolution ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Nome da Instância</label>
                        <input
                            type="text"
                            value={config.evolutionInstanceName}
                            onChange={(e) => setConfig({ ...config, evolutionInstanceName: e.target.value })}
                            className="w-full p-3 border rounded-lg"
                            placeholder="minha-instancia"
                        />
                    </div>
                </div>
            </div>

            {/* ZapSign */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                        ✍️
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">ZapSign</h2>
                        <p className="text-sm text-gray-600">Assinatura Digital de Contratos</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">API Token</label>
                        <div className="flex gap-2">
                            <input
                                type={showKeys.zapsign ? 'text' : 'password'}
                                value={config.zapSignApiToken}
                                onChange={(e) => setConfig({ ...config, zapSignApiToken: e.target.value })}
                                className="flex-1 p-3 border rounded-lg font-mono text-sm"
                                placeholder="..."
                            />
                            <button
                                onClick={() => setShowKeys({ ...showKeys, zapsign: !showKeys.zapsign })}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                {showKeys.zapsign ? '🙈' : '👁️'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Obtenha em:{' '}
                            <a
                                href="https://app.zapsign.com.br/configuracoes/api"
                                target="_blank"
                                className="text-blue-600 hover:underline"
                            >
                                app.zapsign.com.br/configuracoes/api
                            </a>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Template ID Padrão</label>
                        <input
                            type="text"
                            value={config.zapSignTemplateId}
                            onChange={(e) => setConfig({ ...config, zapSignTemplateId: e.target.value })}
                            className="w-full p-3 border rounded-lg font-mono text-sm"
                            placeholder="ID do template de contrato"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            ID do template padrão para envio de contratos
                        </p>
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold mb-2">ℹ️ Informações Importantes</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Cada organização tem suas próprias API Keys</li>
                    <li>• As chaves são armazenadas de forma segura no banco de dados</li>
                    <li>• Use o botão "🧪 Testar" para validar as chaves antes de salvar</li>
                    <li>• As chaves são usadas automaticamente nas conversas desta organização</li>
                </ul>
            </div>
        </div>
    );
}
