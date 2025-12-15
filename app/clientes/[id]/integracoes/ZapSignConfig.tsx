'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader, CheckCircle, XCircle } from 'lucide-react';
import api from '@/app/lib/api-client';

interface ZapSignConfigProps {
    orgId: string;
}

export default function ZapSignConfig({ orgId }: ZapSignConfigProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const [config, setConfig] = useState({
        zapSignEnabled: false,
        zapSignApiToken: '',
        zapSignTemplateId: '',
    });

    useEffect(() => {
        loadConfig();
    }, [orgId]);

    const loadConfig = async () => {
        try {
            const data = await api.organizations.get(orgId);
            setConfig({
                zapSignEnabled: data.zapSignEnabled || false,
                zapSignApiToken: data.zapSignApiToken || '',
                zapSignTemplateId: data.zapSignTemplateId || '',
            });
        } catch (error) {
            console.error('Error loading ZapSign config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.organizations.zapsign.save(orgId, {
                zapSignEnabled: config.zapSignEnabled,
                zapSignApiToken: config.zapSignApiToken,
                zapSignTemplateId: config.zapSignTemplateId,
            });
            alert('✅ Configuração salva com sucesso!');
        } catch (error) {
            console.error('Error saving ZapSign config:', error);
            alert('❌ Erro ao salvar configuração');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!config.zapSignApiToken) {
            setTestResult({ success: false, message: 'Token API é obrigatório' });
            return;
        }

        setTesting(true);
        setTestResult(null);

        try {
            const data = await api.organizations.zapsign.test(orgId, { apiToken: config.zapSignApiToken });
            setTestResult(data);
        } catch (error) {
            setTestResult({ success: false, message: 'Erro ao testar conexão' });
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    id="zapSignEnabled"
                    checked={config.zapSignEnabled}
                    onChange={(e) => setConfig({ ...config, zapSignEnabled: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded"
                />
                <label htmlFor="zapSignEnabled" className="text-sm font-medium">
                    Habilitar ZapSign
                </label>
            </div>

            {/* API Token */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    API Token <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type={showToken ? 'text' : 'password'}
                        value={config.zapSignApiToken}
                        onChange={(e) => setConfig({ ...config, zapSignApiToken: e.target.value })}
                        className="w-full px-4 py-2 pr-12 border rounded-lg"
                        placeholder="Bearer token do ZapSign"
                        disabled={!config.zapSignEnabled}
                    />
                    <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        disabled={!config.zapSignEnabled}
                    >
                        {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Obtenha seu token em: <a href="https://app.zapsign.com.br/configuracoes/api" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">ZapSign API Settings</a>
                </p>
            </div>

            {/* Template ID */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Template ID <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={config.zapSignTemplateId}
                    onChange={(e) => setConfig({ ...config, zapSignTemplateId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="ID do template de contrato"
                    disabled={!config.zapSignEnabled}
                />
                <p className="text-xs text-gray-500 mt-1">
                    ID do template criado no ZapSign com os campos dinâmicos configurados
                </p>
            </div>

            {/* Test Result */}
            {testResult && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {testResult.success ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <XCircle className="w-5 h-5" />
                    )}
                    <span className="text-sm">{testResult.message}</span>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
                <button
                    onClick={handleTest}
                    disabled={!config.zapSignEnabled || !config.zapSignApiToken || testing}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {testing ? <Loader className="w-4 h-4 animate-spin" /> : null}
                    Testar Conexão
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving || !config.zapSignEnabled}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {saving ? <Loader className="w-4 h-4 animate-spin" /> : null}
                    Salvar
                </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h4 className="font-medium text-blue-900 mb-2">📋 Campos do Template</h4>
                <p className="text-sm text-blue-800 mb-2">Configure estes campos dinâmicos no seu template ZapSign:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <code className="bg-blue-100 px-2 py-0.5 rounded">endereco_completo</code> - Endereço do cliente</li>
                    <li>• <code className="bg-blue-100 px-2 py-0.5 rounded">estado_civil</code> - Estado civil</li>
                    <li>• <code className="bg-blue-100 px-2 py-0.5 rounded">profissao</code> - Profissão</li>
                    <li>• <code className="bg-blue-100 px-2 py-0.5 rounded">data_nascimento</code> - Data de nascimento</li>
                    <li>• <code className="bg-blue-100 px-2 py-0.5 rounded">data_atual</code> - Data atual (preenchido automaticamente)</li>
                </ul>
            </div>
        </div>
    );
}
