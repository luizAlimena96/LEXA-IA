import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Play, X } from 'lucide-react';
import { WorkflowAction, ActionModalProps } from './interfaces';
import { testAction, getSampleLeadData } from '../utils/crmWorkflowUtils';

export default function ActionModal({
    show,
    action,
    isEditing,
    onSave,
    onCancel,
    onChange,
    crmAuth
}: ActionModalProps) {
    const [bodyFormat, setBodyFormat] = useState<'json' | 'form-urlencoded' | 'form-data'>('json');
    const [showVariableSelector, setShowVariableSelector] = useState(false);
    const [bodyFields, setBodyFields] = useState<Array<{ key: string, value: string }>>([{ key: '', value: '' }]);
    const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
    const [showTestResult, setShowTestResult] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [testing, setTesting] = useState(false);
    const [sampleData, setSampleData] = useState<any>(null);

    useEffect(() => {
        getSampleLeadData().then(data => setSampleData(data));
    }, []);

    if (!show) return null;

    const handleTestAction = async () => {
        if (!action.name || !action.url) {
            alert('Preencha nome e URL antes de testar');
            return;
        }

        setTesting(true);

        try {
            const actionToTest = { ...action };

            if (bodyFormat === 'form-urlencoded') {
                const urlSearchParams = new URLSearchParams();
                bodyFields.forEach(field => {
                    if (field.key) urlSearchParams.append(field.key, field.value);
                });
                actionToTest.bodyTemplate = urlSearchParams.toString();

                actionToTest.headers = {
                    ...actionToTest.headers,
                    'Content-Type': 'application/x-www-form-urlencoded'
                };
            } else if (bodyFormat === 'form-data') {
                const urlSearchParams = new URLSearchParams();
                bodyFields.forEach(field => {
                    if (field.key) urlSearchParams.append(field.key, field.value);
                });
                actionToTest.bodyTemplate = urlSearchParams.toString();
            }


            const result = await testAction(actionToTest as WorkflowAction, sampleData);

            setTestResult(result);
            setShowTestResult(true);
        } catch (error: any) {
            setTestResult({
                success: false,
                error: error.message || 'Erro ao testar ação'
            });
            setShowTestResult(true);
        } finally {
            setTesting(false);
        }
    };


    const insertVariableAtCursor = (variable: string) => {
        if (bodyFormat === 'json' && bodyTextareaRef.current) {
            const textarea = bodyTextareaRef.current;
            const currentBody = action.bodyTemplate || '{}';

            // Extract the field name from the variable
            // Examples: "{{lead.name}}" -> "name", "{ { lead.name } }" -> "name", "{{CurrentDate}}" -> "current_date"
            let fieldName = 'field';

            // Try to match lead.* variables first
            const leadMatch = variable.match(/\{\s*\{\s*lead\.(\w+)\s*\}\s*\}/);
            if (leadMatch) {
                fieldName = leadMatch[1];
            } else {
                // Try to match special variables like {{CurrentDate}}, {{UUID}}, etc.
                const specialMatch = variable.match(/\{\s*\{\s*(\w+)\s*\}\s*\}/);
                if (specialMatch) {
                    // Convert CamelCase to snake_case for JSON key
                    fieldName = specialMatch[1]
                        .replace(/([A-Z])/g, '_$1')
                        .toLowerCase()
                        .replace(/^_/, '');
                }
            }

            try {
                const currentBody = textarea.value || '{}';
                let jsonObj: any = {};
                if (currentBody.trim()) {
                    try {
                        jsonObj = JSON.parse(currentBody);
                    } catch {
                        jsonObj = {};
                    }
                }

                jsonObj[fieldName] = variable;

                const formattedJson = JSON.stringify(jsonObj, null, 2);

                onChange({
                    ...action,
                    bodyTemplate: formattedJson
                });

                setTimeout(() => {
                    textarea.focus();
                    textarea.setSelectionRange(formattedJson.length, formattedJson.length);
                }, 0);
            } catch (error) {
                console.error('Error formatting JSON:', error);
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newText = currentBody.substring(0, start) + variable + currentBody.substring(end);

                onChange({
                    ...action,
                    bodyTemplate: newText
                });
            }
        } else if (bodyFormat !== 'json') {
            const emptyIndex = bodyFields.findIndex(f => !f.value);
            if (emptyIndex !== -1) {
                const newFields = [...bodyFields];
                newFields[emptyIndex].value = variable;
                setBodyFields(newFields);
            }
        }
    };

    return (
        <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={onCancel}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {isEditing ? 'Editar Ação' : 'Nova Ação'}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nome da Ação *
                            </label>
                            <input
                                type="text"
                                value={action.name || ''}
                                onChange={(e) => onChange({ ...action, name: e.target.value })}
                                placeholder="Ex: Buscar Pessoa no CRM"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Método
                                </label>
                                <select
                                    value={action.method}
                                    onChange={(e) => onChange({ ...action, method: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                >
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="PATCH">PATCH</option>
                                    <option value="DELETE">DELETE</option>
                                </select>
                            </div>
                            <div className="col-span-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    URL *
                                </label>
                                <input
                                    type="url"
                                    value={action.url || ''}
                                    onChange={(e) => onChange({ ...action, url: e.target.value })}
                                    placeholder="https://api.seucrm.com/v1/persons"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Salvar Resposta Como (opcional)
                            </label>
                            <input
                                type="text"
                                value={action.saveResponseAs || ''}
                                onChange={(e) => onChange({ ...action, saveResponseAs: e.target.value })}
                                placeholder="Ex: personData, dealData"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                💡 Use este nome para acessar a resposta em ações seguintes: {`{ {${action.saveResponseAs || 'nomeVariavel'}.campo } } `}
                            </p>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Headers
                                </label>
                                <div className="flex gap-3">
                                    {crmAuth && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const headers = { ...action.headers };
                                                headers['Authorization'] = crmAuth.value;
                                                onChange({ ...action, headers });
                                            }}
                                            className="text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded transition-colors"
                                            title={`Usar chave configurada para ${crmAuth.name} `}
                                        >
                                            <span>🔑</span>
                                            Usar Autenticação Configurada
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const headers = action.headers || {};
                                            const newKey = `header${Object.keys(headers).length + 1} `;
                                            onChange({
                                                ...action,
                                                headers: { ...headers, [newKey]: '' }
                                            });
                                        }}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Adicionar Header
                                    </button>
                                </div>
                            </div>
                            <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                <datalist id="header-keys">
                                    <option value="Authorization" />
                                    <option value="Content-Type" />
                                    <option value="Accept" />
                                    <option value="User-Agent" />
                                </datalist>
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Key</th>
                                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Value</th>
                                            <th className="px-3 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600 dark:bg-gray-800">
                                        {Object.entries(action.headers || {}).map(([key, value], index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-3 py-2">
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            list="header-keys"
                                                            value={key}
                                                            onChange={(e) => {
                                                                const headers = { ...action.headers };
                                                                delete headers[key];
                                                                headers[e.target.value] = value;
                                                                onChange({ ...action, headers });
                                                            }}
                                                            placeholder="Authorization"
                                                            className={`w - full px - 2 py - 1 text - sm border rounded focus: ring - 1 focus: ring - indigo - 500 dark: bg - gray - 700 dark: text - white ${key.toLowerCase() === 'autorization' ? 'border-amber-500 text-amber-600' : 'border-gray-300 dark:border-gray-600'
                                                                } `}
                                                        />
                                                        {key.toLowerCase() === 'autorization' && (
                                                            <div className="absolute left-0 -bottom-5 text-[10px] text-amber-600 font-medium whitespace-nowrap">
                                                                ⚠️ Você quis dizer "Authorization"?
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={value as string}
                                                        onChange={(e) => {
                                                            const headers = { ...action.headers };
                                                            headers[key] = e.target.value;
                                                            onChange({ ...action, headers });
                                                        }}
                                                        placeholder="Bearer sua_chave_aqui"
                                                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const headers = { ...action.headers };
                                                            delete headers[key];
                                                            onChange({ ...action, headers });
                                                        }}
                                                        className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {Object.keys(action.headers || {}).length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="px-3 py-4 text-center text-xs text-gray-400 dark:text-gray-500">
                                                    Nenhum header configurado. Se esta API requer autenticação, adicione o header Authorization.
                                                    <br />
                                                    <span className="opacity-75">
                                                        (Se você selecionou um CRM com chave de API, o header deveria aparecer aqui)
                                                    </span>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Body
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowVariableSelector(!showVariableSelector)}
                                        className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                                    >
                                        {showVariableSelector ? '✖ Fechar' : '📝 Variáveis'}
                                    </button>
                                    {bodyFormat === 'json' && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                try {
                                                    const parsed = JSON.parse(action.bodyTemplate || '{}');
                                                    const formatted = JSON.stringify(parsed, null, 2);
                                                    onChange({ ...action, bodyTemplate: formatted });
                                                } catch (error) {
                                                    alert('JSON inválido. Corrija os erros antes de formatar.');
                                                }
                                            }}
                                            className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors"
                                        >
                                            ✨ Formatar JSON
                                        </button>
                                    )}
                                    <select
                                        value={bodyFormat}
                                        onChange={(e) => {
                                            const newFormat = e.target.value as any;
                                            setBodyFormat(newFormat);
                                            if (newFormat !== 'json') {
                                                setBodyFields([{ key: '', value: '' }]);
                                            }
                                        }}
                                        className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="json">JSON</option>
                                        <option value="form-urlencoded">x-www-form-urlencoded</option>
                                        <option value="form-data">form-data</option>
                                    </select>
                                </div>
                            </div>

                            {showVariableSelector && (
                                <div className="mb-3 p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-lg">🎯</span>
                                        <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Variáveis Disponíveis - Clique para inserir no cursor</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {/* Dados Básicos */}
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                                            <p className="text-xs font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-1">
                                                <span>👤</span> Dados Básicos
                                            </p>
                                            <div className="space-y-1">
                                                {['name', 'phone', 'email', 'cpf'].map(field => (
                                                    <button
                                                        key={field}
                                                        type="button"
                                                        onClick={() => insertVariableAtCursor(`{ { lead.${field} } } `)}
                                                        className="block w-full text-left px-2 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-300 dark:border-blue-600 rounded transition-all hover:shadow-sm"
                                                    >
                                                        <code className="text-blue-700 dark:text-blue-300 font-semibold break-all">{`{ { lead.${field} } } `}</code>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                                            <p className="text-xs font-bold text-green-900 dark:text-green-100 mb-2 flex items-center gap-1">
                                                <span>📊</span> Status
                                            </p>
                                            <div className="space-y-1">
                                                {['currentState', 'status'].map(field => (
                                                    <button
                                                        key={field}
                                                        type="button"
                                                        onClick={() => insertVariableAtCursor(`{ { lead.${field} } } `)}
                                                        className="block w-full text-left px-2 py-1.5 text-xs bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-300 dark:border-green-600 rounded transition-all hover:shadow-sm"
                                                    >
                                                        <code className="text-green-700 dark:text-green-300 font-semibold break-all">{`{ { lead.${field} } } `}</code>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                                            <p className="text-xs font-bold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-1">
                                                <span>🔍</span> Extraídos
                                            </p>
                                            <div className="space-y-1">
                                                {[
                                                    { label: 'campo1', value: 'extractedData.campo1' },
                                                    { label: 'campo2', value: 'extractedData.campo2' },
                                                ].map(field => (
                                                    <button
                                                        key={field.value}
                                                        type="button"
                                                        onClick={() => insertVariableAtCursor(`{ { lead.${field.value} } } `)}
                                                        className="block w-full text-left px-2 py-1.5 text-xs bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-300 dark:border-purple-600 rounded transition-all hover:shadow-sm"
                                                        title={`{ { lead.${field.value} } } `}
                                                    >
                                                        <code className="text-purple-700 dark:text-purple-300 font-semibold text-[10px] break-all leading-tight">
                                                            {`{ { lead.${field.value} } } `}
                                                        </code>
                                                        {sampleData?.extractedData?.[field.label.replace('extractedData.', '')] && (
                                                            <span className="block text-[9px] text-purple-500 dark:text-purple-400 mt-0.5">
                                                                Ex: {sampleData.extractedData[field.label.replace('extractedData.', '')]}
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                                <p className="text-[9px] text-purple-600 dark:text-purple-400 mt-2 italic leading-tight">* Personalize conforme seus dados</p>
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-orange-200 dark:border-orange-700">
                                            <p className="text-xs font-bold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-1">
                                                <span>⚡</span> Especiais
                                            </p>
                                            <div className="space-y-1">
                                                {[
                                                    { var: 'CurrentDate', desc: new Date().toISOString().split('T')[0] },
                                                    { var: 'CurrentTime', desc: 'ISO timestamp' },
                                                    { var: 'UUID', desc: 'ID único' },
                                                ].map(item => (
                                                    <button
                                                        key={item.var}
                                                        type="button"
                                                        onClick={() => insertVariableAtCursor(`{ {${item.var} } } `)}
                                                        className="block w-full text-left px-2 py-1.5 text-xs bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 border border-orange-300 dark:border-orange-600 rounded transition-all hover:shadow-sm"
                                                    >
                                                        <code className="text-orange-700 dark:text-orange-300 font-semibold text-[10px] break-all leading-tight">
                                                            {`{ {${item.var} } } `}
                                                        </code>
                                                        <span className="block text-[9px] text-orange-500 dark:text-orange-400 mt-0.5">
                                                            {item.desc}
                                                        </span>
                                                    </button>
                                                ))}
                                                <p className="text-[9px] text-orange-600 dark:text-orange-400 mt-2 italic leading-tight">
                                                    💡 Use .toUpperCase(), .toLowerCase(), .format()
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {bodyFormat === 'json' && (
                                <>
                                    <textarea
                                        ref={bodyTextareaRef}
                                        value={action.bodyTemplate || ''}
                                        onChange={(e) => onChange({ ...action, bodyTemplate: e.target.value })}
                                        placeholder={'{\n  "name": "{{lead.name}}",\n  "phone": "{{lead.phone}}"\n}'}
                                        rows={8}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        💡 Clique em uma variável para adicioná-la automaticamente como <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{"\"campo\": \"{{lead.campo}}\""}</code> com formatação automática
                                    </p>
                                </>
                            )}

                            {bodyFormat === 'form-urlencoded' && (
                                <>
                                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Key</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Value</th>
                                                    <th className="px-3 py-2 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600 dark:bg-gray-800">
                                                {bodyFields.map((field, index) => (
                                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={field.key}
                                                                onChange={(e) => {
                                                                    const newFields = [...bodyFields];
                                                                    newFields[index].key = e.target.value;
                                                                    setBodyFields(newFields);
                                                                }}
                                                                placeholder="name"
                                                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={field.value}
                                                                onChange={(e) => {
                                                                    const newFields = [...bodyFields];
                                                                    newFields[index].value = e.target.value;
                                                                    setBodyFields(newFields);
                                                                }}
                                                                placeholder="{{lead.name}}"
                                                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newFields = bodyFields.filter((_, i) => i !== index);
                                                                    setBodyFields(newFields.length > 0 ? newFields : [{ key: '', value: '' }]);
                                                                }}
                                                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setBodyFields([...bodyFields, { key: '', value: '' }])}
                                        className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Adicionar Campo
                                    </button>
                                </>
                            )}

                            {bodyFormat === 'form-data' && (
                                <>
                                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Key</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Value</th>
                                                    <th className="px-3 py-2 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-600 dark:bg-gray-800">
                                                {bodyFields.map((field, index) => (
                                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={field.key}
                                                                onChange={(e) => {
                                                                    const newFields = [...bodyFields];
                                                                    newFields[index].key = e.target.value;
                                                                    setBodyFields(newFields);
                                                                }}
                                                                placeholder="name"
                                                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <input
                                                                type="text"
                                                                value={field.value}
                                                                onChange={(e) => {
                                                                    const newFields = [...bodyFields];
                                                                    newFields[index].value = e.target.value;
                                                                    setBodyFields(newFields);
                                                                }}
                                                                placeholder="{{lead.name}}"
                                                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newFields = bodyFields.filter((_, i) => i !== index);
                                                                    setBodyFields(newFields.length > 0 ? newFields : [{ key: '', value: '' }]);
                                                                }}
                                                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setBodyFields([...bodyFields, { key: '', value: '' }])}
                                        className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Adicionar Campo
                                    </button>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="continueOnError"
                                checked={action.continueOnError || false}
                                onChange={(e) => onChange({ ...action, continueOnError: e.target.checked })}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor="continueOnError" className="text-sm text-gray-700 dark:text-gray-300">
                                Continuar workflow mesmo se esta ação falhar
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                        <button
                            onClick={handleTestAction}
                            disabled={testing || !action.url}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            {testing ? 'Testando...' : 'Testar Ação'}
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => onSave(action, bodyFormat, bodyFields)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                            >
                                Salvar Ação
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showTestResult && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {testResult?.success ? (
                                        <><span className="text-green-500">✓</span> Teste Bem-Sucedido</>
                                    ) : (
                                        <><span className="text-red-500">✗</span> Teste Falhou</>
                                    )}
                                </h3>
                                <button
                                    onClick={() => setShowTestResult(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                                {testResult?.requestSent && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">📤 Requisição Enviada:</h4>
                                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                                            <p className="text-sm"><span className="font-semibold">Método:</span> <code className="bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded">{testResult.requestSent.method}</code></p>
                                            <p className="text-sm"><span className="font-semibold">URL:</span> <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs break-all">{testResult.requestSent.url}</code></p>
                                            {testResult.requestSent.body && (
                                                <div>
                                                    <p className="text-sm font-semibold mb-1">Body:</p>
                                                    <pre className="bg-gray-200 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto">{testResult.requestSent.body}</pre>
                                                </div>
                                            )}
                                            {testResult.requestSent.headers && Object.keys(testResult.requestSent.headers).length > 0 && (
                                                <div>
                                                    <p className="text-sm font-semibold mb-1">Headers:</p>
                                                    <pre className="bg-gray-200 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto">{JSON.stringify(testResult.requestSent.headers, null, 2)}</pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {testResult?.response && (
                                    <div>
                                        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">✅ Resposta Recebida:</h4>
                                        <pre className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 rounded-lg text-xs overflow-x-auto">
                                            {JSON.stringify(testResult.response, null, 2)}
                                        </pre>
                                    </div>
                                )}

                                {testResult?.error && (
                                    <div>
                                        <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">❌ Erro:</h4>
                                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 rounded-lg">
                                            <p className="text-sm text-red-800 dark:text-red-200">{testResult.error}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setShowTestResult(false)}
                                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
