'use client';

import { useState } from 'react';
import { TestTube2, Calendar, Clock, Loader2 } from 'lucide-react';
import api from '@/app/lib/api-client';

interface AutoSchedulingSlotTesterProps {
    agentId: string;
    configId: string | null;
    duration: number;
    showMessage: (type: 'success' | 'error', text: string) => void;
}

export default function AutoSchedulingSlotTester({
    agentId,
    configId,
    duration,
    showMessage,
}: AutoSchedulingSlotTesterProps) {
    const [testing, setTesting] = useState(false);
    const [testSlots, setTestSlots] = useState<any[]>([]);

    const handleTestSlots = async () => {
        if (!configId) {
            showMessage('error', 'Salve a configuração primeiro para testar');
            return;
        }

        try {
            setTesting(true);
            const data = await api.agents.autoScheduling.testSlots(agentId, {
                configId,
                limit: 3,
            });
            setTestSlots(data.slots || []);
            showMessage('success', `${data.slots?.length || 0} horários encontrados!`);
        } catch (error) {
            console.error('Error testing slots:', error);
            showMessage('error', 'Erro ao testar horários');
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
                <TestTube2 className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Testar Horários Disponíveis
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        Veja os próximos horários disponíveis baseados nesta configuração
                    </p>

                    <button
                        onClick={handleTestSlots}
                        disabled={testing || !configId}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
                    >
                        {testing ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Testando...
                            </>
                        ) : (
                            <>
                                <TestTube2 className="h-4 w-4" />
                                Testar Agora
                            </>
                        )}
                    </button>

                    {testSlots.length > 0 && (
                        <div className="mt-4 space-y-2">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Próximos horários disponíveis:
                            </p>
                            {testSlots.map((slot, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300 bg-white dark:bg-blue-950/30 rounded px-3 py-2"
                                >
                                    <Calendar className="h-3 w-3" />
                                    <span>{slot.date}</span>
                                    <Clock className="h-3 w-3 ml-2" />
                                    <span>{slot.time}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
