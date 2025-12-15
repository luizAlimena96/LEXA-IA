import Modal from "../../../components/Modal";
import { Save, Clock, Upload, X, FileText, Image, Calendar, AlertCircle } from "lucide-react";
import { useState } from "react";
import CRMStageSelector from '@/app/components/CRMStageSelector';
import { FollowupModalProps } from '../interfaces';

export default function FollowupModal({
    isOpen,
    onClose,
    onSave,
    isEditing,
    form,
    onFormChange,
    agentId,
}: FollowupModalProps) {
    const [uploading, setUploading] = useState(false);

    const triggerMode = form.triggerMode || 'TIMER';
    const mediaUrls = form.mediaUrls || [];

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (mediaUrls.length + files.length > 5) {
            alert('Máximo de 5 arquivos permitidos');
            return;
        }

        setUploading(true);
        try {
            const uploadedUrls: string[] = [];

            for (const file of files) {
                const maxSize = file.type.startsWith('image/') ? 16 * 1024 * 1024 : 20 * 1024 * 1024;
                if (file.size > maxSize) {
                    alert(`Arquivo ${file.name} excede o tamanho máximo (${file.type.startsWith('image/') ? '16MB' : '20MB'})`);
                    continue;
                }
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/upload/drive', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const { url } = await response.json();
                    uploadedUrls.push(url);
                }
            }

            onFormChange({
                ...form,
                mediaUrls: [...mediaUrls, ...uploadedUrls],
            });
        } catch (error) {
            console.error('Upload error:', error);
            alert('Erro ao fazer upload dos arquivos');
        } finally {
            setUploading(false);
        }
    };

    const removeMedia = (index: number) => {
        const newMediaUrls = mediaUrls.filter((_, i) => i !== index);
        onFormChange({ ...form, mediaUrls: newMediaUrls });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Editar Follow-up" : "Criar Follow-up"}
            size="xl"
        >
            <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome *
                    </label>
                    <input
                        type="text"
                        value={form.name}
                        onChange={(e) =>
                            onFormChange({ ...form, name: e.target.value })
                        }
                        placeholder="Ex: Lembrete após 24h"
                        className="input-primary"
                    />
                </div>

                <CRMStageSelector
                    agentId={agentId}
                    value={form.crmStageId || null}
                    onChange={(stageId) => onFormChange({ ...form, crmStageId: stageId })}
                    label="Vincular à Etapa CRM (Obrigatório)"
                    placeholder="Selecione uma etapa..."
                    required
                />

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Modo de Disparo
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => onFormChange({ ...form, triggerMode: 'TIMER' })}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${triggerMode === 'TIMER'
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 dark:border-indigo-400'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Clock className={`w-4 h-4 ${triggerMode === 'TIMER' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                                <span className="font-semibold text-sm dark:text-gray-100">Timer</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Após X minutos sem resposta</p>
                        </button>

                        <button
                            type="button"
                            onClick={() => onFormChange({ ...form, triggerMode: 'SCHEDULED' })}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${triggerMode === 'SCHEDULED'
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 dark:border-indigo-400'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className={`w-4 h-4 ${triggerMode === 'SCHEDULED' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                                <span className="font-semibold text-sm dark:text-gray-100">Horário Fixo</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Enviar em horário específico</p>
                        </button>
                    </div>
                </div>

                {triggerMode === 'TIMER' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Delay (minutos) *
                        </label>
                        <input
                            type="number"
                            value={form.delayMinutes || 60}
                            onChange={(e) =>
                                onFormChange({ ...form, delayMinutes: parseInt(e.target.value) })
                            }
                            min="1"
                            className="input-primary"
                            placeholder="60"
                        />
                    </div>
                )}

                {triggerMode === 'SCHEDULED' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Horário de Envio *
                        </label>
                        <input
                            type="time"
                            value={form.scheduledTime || ''}
                            onChange={(e) =>
                                onFormChange({ ...form, scheduledTime: e.target.value })
                            }
                            className="input-primary"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Formato 24h (ex: 22:00)</p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Mensagem *
                    </label>
                    <textarea
                        value={form.message}
                        onChange={(e) =>
                            onFormChange({ ...form, message: e.target.value })
                        }
                        placeholder="Olá {{lead.name}}, ainda tem interesse?"
                        rows={4}
                        className="input-primary resize-none"
                    />

                    <div className="mt-3 p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">🎯</span>
                            <p className="text-sm font-bold text-blue-900 dark:text-blue-200">Variáveis Disponíveis - Clique para inserir</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {/* Dados Básicos */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                                <p className="text-xs font-bold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-1">
                                    <span>👤</span> Dados Básicos
                                </p>
                                <div className="space-y-1">
                                    {['name', 'phone', 'email', 'cpf'].map(field => (
                                        <button
                                            key={field}
                                            type="button"
                                            onClick={() => {
                                                const variable = `{{lead.${field}}}`;
                                                const textarea = document.querySelector('textarea[placeholder*="lead.name"]') as HTMLTextAreaElement;
                                                if (textarea) {
                                                    const start = textarea.selectionStart;
                                                    const end = textarea.selectionEnd;
                                                    const text = form.message;
                                                    const newText = text.substring(0, start) + variable + text.substring(end);
                                                    onFormChange({ ...form, message: newText });
                                                    setTimeout(() => {
                                                        textarea.focus();
                                                        textarea.setSelectionRange(start + variable.length, start + variable.length);
                                                    }, 0);
                                                }
                                            }}
                                            className="block w-full text-left px-2 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-300 dark:border-blue-700 rounded transition-all hover:shadow-sm"
                                        >
                                            <code className="text-blue-700 dark:text-blue-300 font-semibold break-all">{`{{lead.${field}}}`}</code>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-green-200 dark:border-green-700">
                                <p className="text-xs font-bold text-green-900 dark:text-green-200 mb-2 flex items-center gap-1">
                                    <span>📊</span> Status
                                </p>
                                <div className="space-y-1">
                                    {['currentState', 'status'].map(field => (
                                        <button
                                            key={field}
                                            type="button"
                                            onClick={() => {
                                                const variable = `{{lead.${field}}}`;
                                                const textarea = document.querySelector('textarea[placeholder*="lead.name"]') as HTMLTextAreaElement;
                                                if (textarea) {
                                                    const start = textarea.selectionStart;
                                                    const end = textarea.selectionEnd;
                                                    const text = form.message;
                                                    const newText = text.substring(0, start) + variable + text.substring(end);
                                                    onFormChange({ ...form, message: newText });
                                                    setTimeout(() => {
                                                        textarea.focus();
                                                        textarea.setSelectionRange(start + variable.length, start + variable.length);
                                                    }, 0);
                                                }
                                            }}
                                            className="block w-full text-left px-2 py-1.5 text-xs bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-300 dark:border-green-700 rounded transition-all hover:shadow-sm"
                                        >
                                            <code className="text-green-700 dark:text-green-300 font-semibold break-all">{`{{lead.${field}}}`}</code>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                                <p className="text-xs font-bold text-purple-900 dark:text-purple-200 mb-2 flex items-center gap-1">
                                    <span>🔍</span> Extraídos
                                </p>
                                <div className="space-y-1">
                                    {[
                                        { label: 'campo1', value: 'extractedData.campo1' },
                                        { label: 'campo2', value: 'extractedData.campo2' },
                                        { label: 'valor', value: 'extractedData.valor' }
                                    ].map(field => (
                                        <button
                                            key={field.value}
                                            type="button"
                                            onClick={() => {
                                                const variable = `{{lead.${field.value}}}`;
                                                const textarea = document.querySelector('textarea[placeholder*="lead.name"]') as HTMLTextAreaElement;
                                                if (textarea) {
                                                    const start = textarea.selectionStart;
                                                    const end = textarea.selectionEnd;
                                                    const text = form.message;
                                                    const newText = text.substring(0, start) + variable + text.substring(end);
                                                    onFormChange({ ...form, message: newText });
                                                    setTimeout(() => {
                                                        textarea.focus();
                                                        textarea.setSelectionRange(start + variable.length, start + variable.length);
                                                    }, 0);
                                                }
                                            }}
                                            className="block w-full text-left px-2 py-1.5 text-xs bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-300 dark:border-purple-700 rounded transition-all hover:shadow-sm"
                                            title={`{{lead.${field.value}}}`}
                                        >
                                            <code className="text-purple-700 dark:text-purple-300 font-semibold text-[10px] break-all leading-tight">
                                                {`{{lead.${field.value}}}`}
                                            </code>
                                        </button>
                                    ))}
                                    <p className="text-[9px] text-purple-600 dark:text-purple-400 mt-2 italic leading-tight">* Personalize conforme seus dados</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Anexos de Mídia (Máx: 5 arquivos)
                    </label>
                    <div className="space-y-2">
                        {mediaUrls.map((url, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                {url.includes('image') || url.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                                    <Image className="w-4 h-4 text-blue-600" />
                                ) : (
                                    <FileText className="w-4 h-4 text-gray-600" />
                                )}
                                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{url.split('/').pop()}</span>
                                <button
                                    type="button"
                                    onClick={() => removeMedia(index)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        {mediaUrls.length < 5 && (
                            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors">
                                <Upload className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {uploading ? 'Enviando...' : 'Adicionar Arquivo'}
                                </span>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">📌 Imagens: 16MB | Documentos: 20MB</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        URL de Vídeo (Google Drive)
                    </label>
                    <input
                        type="url"
                        value={form.videoUrl || ''}
                        onChange={(e) =>
                            onFormChange({ ...form, videoUrl: e.target.value })
                        }
                        placeholder="https://drive.google.com/file/d/..."
                        className="input-primary"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cole o link compartilhável do Google Drive</p>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                        <input
                            type="checkbox"
                            id="business-hours"
                            checked={form.businessHoursEnabled || false}
                            onChange={(e) =>
                                onFormChange({ ...form, businessHoursEnabled: e.target.checked })
                            }
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="business-hours" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Respeitar Horário Comercial
                        </label>
                    </div>

                    {form.businessHoursEnabled && (
                        <>
                            <div className="flex items-start gap-2 mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                    <strong>Atenção:</strong> Mensagens só serão enviadas em dias úteis (seg-sex) no horário definido.
                                    Se o timer expirar fora do horário, a mensagem será enviada no próximo horário disponível.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Início
                                    </label>
                                    <input
                                        type="time"
                                        value={form.businessHoursStart || '08:00'}
                                        onChange={(e) =>
                                            onFormChange({ ...form, businessHoursStart: e.target.value })
                                        }
                                        className="input-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Fim
                                    </label>
                                    <input
                                        type="time"
                                        value={form.businessHoursEnd || '18:00'}
                                        onChange={(e) =>
                                            onFormChange({ ...form, businessHoursEnd: e.target.value })
                                        }
                                        className="input-primary"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="followup-active"
                        checked={form.isActive}
                        onChange={(e) =>
                            onFormChange({ ...form, isActive: e.target.checked })
                        }
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="followup-active" className="text-sm text-gray-700 dark:text-gray-300">
                        Ativo
                    </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {isEditing ? "Atualizar" : "Criar"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
