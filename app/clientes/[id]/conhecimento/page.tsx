'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import api from '@/app/lib/api-client';

export default function KnowledgeBasePage() {
    const params = useParams();
    const orgId = params.id as string;

    const [knowledge, setKnowledge] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadKnowledge();
    }, []);

    const loadKnowledge = async () => {
        try {
            const data = await api.organizations.knowledge.list(orgId);
            setKnowledge(data);
        } catch (error) {
            console.error('Error loading knowledge:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            alert('Por favor, selecione um arquivo CSV');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            await api.organizations.knowledge.upload(orgId, formData);
            alert('Knowledge base atualizada com sucesso!');
            loadKnowledge();
        } catch (error) {
            console.error('Error uploading:', error);
            alert('Erro ao fazer upload');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deletar este conhecimento?')) return;

        try {
            await api.organizations.knowledge.delete(orgId, id);
            loadKnowledge();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    if (loading) return <div className="p-8">Carregando...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Base de Conhecimento</h1>
                <label className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer">
                    {uploading ? 'Enviando...' : '📤 Upload CSV'}
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                    />
                </label>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-bold mb-2">📋 Formato do CSV</h3>
                <p className="text-sm text-gray-700 mb-2">
                    O arquivo CSV deve ter as seguintes colunas:
                </p>
                <code className="block bg-white p-2 rounded text-sm">
                    title,content,type
                </code>
                <p className="text-sm text-gray-600 mt-2">
                    <strong>type:</strong> FAQ, PRODUCT, POLICY, PROCEDURE, etc.
                </p>
            </div>

            <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b">
                    <h2 className="text-xl font-bold">
                        Conhecimento Atual ({knowledge.length} itens)
                    </h2>
                </div>

                <div className="divide-y">
                    {knowledge.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Nenhum conhecimento cadastrado. Faça upload de um CSV para começar.
                        </div>
                    ) : (
                        knowledge.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-bold">{item.title}</h3>
                                            <span className="px-2 py-1 bg-gray-100 text-xs rounded">
                                                {item.type}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm line-clamp-2">
                                            {item.content}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Criado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="ml-4 px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                                    >
                                        Deletar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-bold mb-2">⚠️ Importante</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Fazer upload de um novo CSV <strong>substitui</strong> toda a base de conhecimento</li>
                    <li>• O processamento pode levar alguns minutos para bases grandes</li>
                    <li>• A IA usará automaticamente este conhecimento nas conversas</li>
                </ul>
            </div>
        </div>
    );
}
