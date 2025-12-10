import { Plus, Trash2 } from 'lucide-react';
import { FieldMapping } from './types';

interface FieldMappingTabProps {
    fieldMappings: FieldMapping[];
    setFieldMappings: (mappings: FieldMapping[]) => void;
    onSave: () => Promise<void>;
}

export default function FieldMappingTab({
    fieldMappings,
    setFieldMappings,
    onSave
}: FieldMappingTabProps) {
    const lexaFields = [
        'lead.name', 'lead.phone', 'lead.email', 'lead.status', 'lead.source', 'lead.notes',
        'appointment.scheduledAt', 'appointment.duration', 'appointment.title', 'appointment.notes',
        'conversation.status', 'conversation.lastMessage'
    ];

    const addFieldMapping = () => {
        setFieldMappings([...fieldMappings, { lexaField: '', crmField: '', transform: '' }]);
    };

    const removeFieldMapping = (index: number) => {
        setFieldMappings(fieldMappings.filter((_, i) => i !== index));
    };

    const updateFieldMapping = (index: number, field: keyof FieldMapping, value: string) => {
        const updated = [...fieldMappings];
        updated[index] = { ...updated[index], [field]: value };
        setFieldMappings(updated);
    };

    const generateExamplePayload = () => {
        const payload: any = {};
        fieldMappings.forEach(mapping => {
            if (mapping.crmField) {
                const value = mapping.lexaField.includes('phone') ? '11999999999' :
                    mapping.lexaField.includes('email') ? 'exemplo@email.com' :
                        mapping.lexaField.includes('scheduledAt') ? new Date().toISOString() :
                            mapping.lexaField.includes('duration') ? 60 :
                                mapping.lexaField.includes('status') ? 'novo' :
                                    'Exemplo';
                payload[mapping.crmField] = value;
            }
        });
        return JSON.stringify(payload, null, 2);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mapeamento de Campos</h2>
                <div className="flex gap-2">
                    <button
                        onClick={onSave}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                    >
                        Salvar Mapeamento
                    </button>
                    <button
                        onClick={addFieldMapping}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar Campo
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <div className="grid grid-cols-12 gap-3 text-sm font-medium text-gray-700 dark:text-gray-300 pb-2 border-b dark:border-gray-600">
                    <div className="col-span-4">Campo LEXA</div>
                    <div className="col-span-4">Campo CRM</div>
                    <div className="col-span-3">Transformação</div>
                    <div className="col-span-1"></div>
                </div>

                {fieldMappings.map((mapping, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-4">
                            <select
                                value={mapping.lexaField}
                                onChange={(e) => updateFieldMapping(index, 'lexaField', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">Selecione...</option>
                                {lexaFields.map(field => (
                                    <option key={field} value={field}>{field}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-4">
                            <input
                                type="text"
                                value={mapping.crmField}
                                onChange={(e) => updateFieldMapping(index, 'crmField', e.target.value)}
                                placeholder="nome_campo_crm"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="col-span-3">
                            <select
                                value={mapping.transform || ''}
                                onChange={(e) => updateFieldMapping(index, 'transform', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm dark:bg-gray-700 dark:text-white"
                            >
                                <option value="">Nenhuma</option>
                                <option value="toISOString">toISOString()</option>
                                <option value="toLowerCase">toLowerCase()</option>
                                <option value="toUpperCase">toUpperCase()</option>
                                <option value="trim">trim()</option>
                            </select>
                        </div>
                        <div className="col-span-1">
                            <button
                                onClick={() => removeFieldMapping(index)}
                                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Preview do Payload:</h3>
                <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                    {generateExamplePayload()}
                </pre>
            </div>
        </div>
    );
}

