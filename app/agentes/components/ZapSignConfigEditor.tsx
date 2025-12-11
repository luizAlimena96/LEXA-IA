'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, FileSignature, Info, AlertCircle } from 'lucide-react';

interface FieldMapping {
    id: string;
    templateField: string; // Campo no template (ex: {{ $json.nome }})
    leadField: string;      // Campo do lead (ex: name, cpf, email, etc.)
    label: string;          // Label para exibição
}

interface ZapSignConfigEditorProps {
    agentId: string;
}

// Campos disponíveis no template ZapSign (baseado no n8n)
const TEMPLATE_FIELDS = [
    { field: '{{ $json.nome }}', description: 'Nome completo do signatário' },
    { field: '{{ $json.cpf }}', description: 'CPF do signatário' },
    { field: '{{ $json.rg }}', description: 'RG do signatário' },
    { field: '{{ $json.email }}', description: 'Email do signatário' },
    { field: '{{ $json.telefone }}', description: 'Telefone do signatário' },
    { field: '{{ $json.estado_civil }}', description: 'Estado civil' },
    { field: '{{ $json.profissao }}', description: 'Profissão' },
    { field: '{{ $json.endereco_completo }}', description: 'Endereço completo' },
    { field: '{{ $json.data_nascimento }}', description: 'Data de nascimento' },
    { field: '{{ $json.data }}', description: 'Data atual (gerada automaticamente)' },
];

const AVAILABLE_LEAD_FIELDS = [
    { value: 'name', label: 'Nome Completo' },
    { value: 'cpf', label: 'CPF' },
    { value: 'rg', label: 'RG' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Telefone' },
    { value: 'address', label: 'Endereço Completo' },
    { value: 'maritalStatus', label: 'Estado Civil' },
    { value: 'profession', label: 'Profissão' },
    { value: 'birthDate', label: 'Data de Nascimento' },
    { value: 'currentDate', label: 'Data Atual (automático)' },
];

export default function ZapSignConfigEditor({ agentId }: ZapSignConfigEditorProps) {
    const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadConfig();
    }, [agentId]);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/agents/${agentId}/zapsign-config`);

            if (!response.ok) {
                throw new Error('Erro ao carregar configuração');
            }

            const data = await response.json();

            // Se não houver configuração, inicializa com TODOS os campos pré-mapeados
            if (!data.fieldMappings || data.fieldMappings.length === 0) {
                setFieldMappings([
                    { id: crypto.randomUUID(), templateField: '{{ $json.nome }}', leadField: '{{ lead.name }}', label: 'Nome Completo' },
                    { id: crypto.randomUUID(), templateField: '{{ $json.cpf }}', leadField: '{{ lead.cpf }}', label: 'CPF' },
                    { id: crypto.randomUUID(), templateField: '{{ $json.rg }}', leadField: '{{ lead.rg }}', label: 'RG' },
                    { id: crypto.randomUUID(), templateField: '{{ $json.email }}', leadField: '{{ lead.email }}', label: 'Email' },
                    { id: crypto.randomUUID(), templateField: '{{ $json.telefone }}', leadField: '{{ lead.phone }}', label: 'Telefone' },
                    { id: crypto.randomUUID(), templateField: '{{ $json.estado_civil }}', leadField: '{{ lead.extractedData.estado_civil }}', label: 'Estado Civil' },
                    { id: crypto.randomUUID(), templateField: '{{ $json.profissao }}', leadField: '{{ lead.extractedData.profissao }}', label: 'Profissão' },
                    { id: crypto.randomUUID(), templateField: '{{ $json.endereco_completo }}', leadField: '{{ lead.extractedData.endereco_completo }}', label: 'Endereço Completo' },
                    { id: crypto.randomUUID(), templateField: '{{ $json.data_nascimento }}', leadField: '{{ lead.extractedData.data_nascimento }}', label: 'Data de Nascimento' },
                    { id: crypto.randomUUID(), templateField: '{{ $json.data }}', leadField: '{{ currentDate }}', label: 'Data Atual' },
                ]);
            } else {
                setFieldMappings(data.fieldMappings);
            }
        } catch (error) {
            console.error('Error loading config:', error);
            showMessage('error', 'Não foi possível carregar a configuração');
            // Inicializa com campos padrão em caso de erro
            setFieldMappings([
                { id: crypto.randomUUID(), templateField: '{{ $json.nome }}', leadField: '{{ lead.name }}', label: 'Nome Completo' },
                { id: crypto.randomUUID(), templateField: '{{ $json.cpf }}', leadField: '{{ lead.cpf }}', label: 'CPF' },
                { id: crypto.randomUUID(), templateField: '{{ $json.rg }}', leadField: '{{ lead.rg }}', label: 'RG' },
                { id: crypto.randomUUID(), templateField: '{{ $json.email }}', leadField: '{{ lead.email }}', label: 'Email' },
                { id: crypto.randomUUID(), templateField: '{{ $json.telefone }}', leadField: '{{ lead.phone }}', label: 'Telefone' },
                { id: crypto.randomUUID(), templateField: '{{ $json.estado_civil }}', leadField: '{{ lead.extractedData.estado_civil }}', label: 'Estado Civil' },
                { id: crypto.randomUUID(), templateField: '{{ $json.profissao }}', leadField: '{{ lead.extractedData.profissao }}', label: 'Profissão' },
                { id: crypto.randomUUID(), templateField: '{{ $json.endereco_completo }}', leadField: '{{ lead.extractedData.endereco_completo }}', label: 'Endereço Completo' },
                { id: crypto.randomUUID(), templateField: '{{ $json.data_nascimento }}', leadField: '{{ lead.extractedData.data_nascimento }}', label: 'Data de Nascimento' },
                { id: crypto.randomUUID(), templateField: '{{ $json.data }}', leadField: '{{ currentDate }}', label: 'Data Atual' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleAddField = () => {
        setFieldMappings([
            ...fieldMappings,
            {
                id: crypto.randomUUID(),
                templateField: '',
                leadField: '',
                label: '',
            },
        ]);
    };

    const handleRemoveField = (id: string) => {
        setFieldMappings(fieldMappings.filter((f) => f.id !== id));
    };

    const handleUpdateField = (id: string, updates: Partial<FieldMapping>) => {
        setFieldMappings(
            fieldMappings.map((f) => (f.id === id ? { ...f, ...updates } : f))
        );
    };

    const handleSave = async () => {
        // Validação
        const invalidFields = fieldMappings.filter(
            (f) => !f.templateField.trim() || !f.leadField || !f.label.trim()
        );

        if (invalidFields.length > 0) {
            showMessage('error', 'Preencha todos os campos obrigatórios');
            return;
        }

        try {
            setSaving(true);
            const response = await fetch(`/api/agents/${agentId}/zapsign-config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fieldMappings }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao salvar');
            }

            showMessage('success', 'Configuração salva com sucesso!');
        } catch (error: any) {
            console.error('Error saving config:', error);
            showMessage('error', error.message || 'Erro ao salvar configuração');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Message Toast */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300'}`}>
                    <div className="flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <span>{message.text}</span>
                    </div>
                </div>
            )}

            {/* Info Alert */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-2">
                    <FileSignature className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p className="font-medium mb-1">Configuração ZapSign</p>
                        <p>
                            Mapeie os campos do seu template ZapSign para os dados do lead.
                            Configure o Template ID e Bearer Token na aba de <strong>Clientes</strong>.
                        </p>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mapeamento de Campos</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {fieldMappings.length} campo{fieldMappings.length !== 1 ? 's' : ''} configurado{fieldMappings.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={handleAddField}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Adicionar Campo
                </button>
            </div>

            {/* Fields List */}
            {fieldMappings.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <FileSignature className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                        Nenhum campo configurado
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Clique em "Adicionar Campo" para começar
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {fieldMappings.map((field) => (
                        <div
                            key={field.id}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Label */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Label *
                                    </label>
                                    <input
                                        type="text"
                                        value={field.label}
                                        onChange={(e) =>
                                            handleUpdateField(field.id, { label: e.target.value })
                                        }
                                        placeholder="Ex: Nome Completo"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm"
                                    />
                                </div>

                                {/* Template Field */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Campo do Template *
                                    </label>
                                    <input
                                        type="text"
                                        value={field.templateField}
                                        onChange={(e) =>
                                            handleUpdateField(field.id, { templateField: e.target.value })
                                        }
                                        placeholder="Ex: {{ $json.nome }}"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm"
                                    />
                                </div>

                                {/* Lead Field */}
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Origem dos Dados *
                                        </label>
                                        <input
                                            type="text"
                                            value={field.leadField}
                                            onChange={(e) =>
                                                handleUpdateField(field.id, { leadField: e.target.value })
                                            }
                                            placeholder="Ex: {{ lead.extractedData.estado_civil }}"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-mono text-sm"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Use: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{ lead.campo }}'}</code> ou <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{'{{ lead.extractedData.campo }}'}</code>
                                        </p>
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            onClick={() => handleRemoveField(field.id)}
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            title="Remover campo"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Warning about Template ID */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-medium mb-1">Importante</p>
                        <p>
                            Os campos do template devem corresponder exatamente aos campos configurados no seu template ZapSign.
                            Certifique-se de que o Template ID e Bearer Token estão configurados na aba de Clientes.
                        </p>
                    </div>
                </div>
            </div>

            {/* WhatsApp Message Preview */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span>💬</span> Preview da Mensagem WhatsApp
                </h4>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 font-mono text-sm">
                    <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                        {`📈 | *NOVO CONTRATO* |

📅  Data: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
• Whatsapp - `}<span className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">{'lead.phone'}</span>{`


💬  Link:
`}<span className="bg-blue-200 dark:bg-blue-800 px-1 rounded">{'document.signers[0].sign_url'}</span>
                    </div>
                </div>
                <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        📱 <strong>Whatsapp</strong>: Usa o telefone do lead (<code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">lead.phone</code>)
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        🔗 <strong>Link</strong>: Retornado pela API ZapSign após criar o documento (<code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">document.signers[0].sign_url</code>)
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        ✅ Esta mensagem é enviada automaticamente após a criação do contrato
                    </p>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={handleSave}
                    disabled={saving || fieldMappings.length === 0}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>Salvar Configuração</>
                    )}
                </button>
            </div>
        </div>
    );
}
