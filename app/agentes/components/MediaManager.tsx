import { useState } from 'react';
import { Plus, Trash2, Image, Video, FileText, Music } from 'lucide-react';
import { MediaItem } from './interfaces';

interface MediaManagerProps {
    mediaItems: MediaItem[];
    onChange: (items: MediaItem[]) => void;
}

export default function MediaManager({ mediaItems, onChange }: MediaManagerProps) {
    const [newMediaUrl, setNewMediaUrl] = useState('');
    const [newMediaType, setNewMediaType] = useState<'image' | 'video' | 'document' | 'audio'>('image');
    const [newMediaCaption, setNewMediaCaption] = useState('');
    const [newMediaFileName, setNewMediaFileName] = useState('');

    const handleAddMedia = () => {
        if (!newMediaUrl.trim()) return;

        const newMedia: MediaItem = {
            id: crypto.randomUUID(),
            url: newMediaUrl.trim(),
            type: newMediaType,
            caption: newMediaCaption.trim() || undefined,
            fileName: newMediaFileName.trim() || undefined,
        };

        onChange([...mediaItems, newMedia]);

        // Reset form
        setNewMediaUrl('');
        setNewMediaCaption('');
        setNewMediaFileName('');
    };

    const handleRemoveMedia = (id: string) => {
        onChange(mediaItems.filter(item => item.id !== id));
    };

    const getMediaIcon = (type: string) => {
        switch (type) {
            case 'image':
                return <Image className="w-5 h-5" />;
            case 'video':
                return <Video className="w-5 h-5" />;
            case 'document':
                return <FileText className="w-5 h-5" />;
            case 'audio':
                return <Music className="w-5 h-5" />;
            default:
                return <FileText className="w-5 h-5" />;
        }
    };

    const getMediaTypeLabel = (type: string) => {
        const labels = {
            image: 'Imagem',
            video: 'Vídeo',
            document: 'Documento',
            audio: 'Áudio'
        };
        return labels[type as keyof typeof labels] || type;
    };

    return (
        <div className="space-y-4">
            {/* Add Media Form */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        URL da Mídia *
                    </label>
                    <input
                        type="text"
                        value={newMediaUrl}
                        onChange={(e) => setNewMediaUrl(e.target.value)}
                        placeholder="https://drive.google.com/file/d/... ou URL direta"
                        className="input-primary"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Suporta Google Drive URLs (serão convertidas automaticamente)
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tipo de Mídia
                        </label>
                        <select
                            value={newMediaType}
                            onChange={(e) => setNewMediaType(e.target.value as any)}
                            className="input-primary"
                        >
                            <option value="image">Imagem</option>
                            <option value="video">Vídeo</option>
                            <option value="document">Documento</option>
                            <option value="audio">Áudio</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nome do Arquivo (opcional)
                        </label>
                        <input
                            type="text"
                            value={newMediaFileName}
                            onChange={(e) => setNewMediaFileName(e.target.value)}
                            placeholder="documento.pdf"
                            className="input-primary"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Legenda (opcional)
                    </label>
                    <input
                        type="text"
                        value={newMediaCaption}
                        onChange={(e) => setNewMediaCaption(e.target.value)}
                        placeholder="Texto que acompanha a mídia"
                        className="input-primary"
                    />
                </div>

                <button
                    type="button"
                    onClick={handleAddMedia}
                    disabled={!newMediaUrl.trim()}
                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar Mídia
                </button>
            </div>

            {/* Media List */}
            {mediaItems.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Mídias Configuradas ({mediaItems.length})
                    </h4>
                    <div className="space-y-2">
                        {mediaItems.map((item, index) => (
                            <div
                                key={item.id}
                                className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg group"
                            >
                                <div className="flex-shrink-0 text-indigo-600 dark:text-indigo-400 mt-1 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                    {getMediaIcon(item.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-900 dark:text-white truncate">
                                            {item.fileName || "Sem nome"}
                                        </span>
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider
                                            ${item.type === 'image' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                item.type === 'video' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                                    item.type === 'audio' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                                            {getMediaTypeLabel(item.type)}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline truncate flex-1 block"
                                            title={item.url}
                                        >
                                            {item.url}
                                        </a>
                                    </div>

                                    {item.caption && (
                                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-800">
                                            <span className="font-medium text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Legenda:</span>
                                            {item.caption}
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveMedia(item.id)}
                                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remover mídia"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {mediaItems.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                    Nenhuma mídia adicionada. Use o formulário acima para adicionar imagens, vídeos, documentos ou áudios.
                </div>
            )}
        </div>
    );
}
