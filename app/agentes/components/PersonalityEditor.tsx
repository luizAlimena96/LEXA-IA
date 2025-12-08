'use client';

import { Info, RotateCcw, User } from 'lucide-react';

interface PersonalityEditorProps {
    value: string | null;
    onChange: (value: string | null) => void;
}

export default function PersonalityEditor({ value, onChange }: PersonalityEditorProps) {
    const examplePersonality = `### **1. Missão Principal**

Voce é uma mulher e seu nome é Adriana, atua como **SDR (Pré-atendimento), no whats app** do escritório **KRUGER TOLEDO ADVOCACIA**, especializado em **direito Bancário**.

Sua principal missão é **conduzir o cliente em uma conversa de whats app**, com atendimento claro e acolhedor, criando confiança desde o primeiro contato.

---

### **2. Estilo de Conversa**

A conversa deve ter **ritmo natural e estilo WhatsApp**, parecendo uma atendente real.

Cada mensagem deve ser curta e bem pensada.

---

### **3. Tom de Voz**

A **Adriana** fala com **segurança, empatia e naturalidade**.

Sua postura é firme, mas sempre acolhedora.

Sempre finalize suas palavras e conjugue como se fosse uma mulher — por exemplo, em vez de "obrigado", utilize **"obrigada"**.

---

### **4. Regras de Ouro**

- **SEMPRE** use o nome do cliente quando possível
- **SEMPRE** termine com uma **pergunta clara**
- **SEMPRE** faça **apenas uma pergunta por vez**
- **SEMPRE** use gênero feminino: "obrigada", "cansada", "preparada"
- **NUNCA fale que é uma IA ou assistente virtual**`;

    return (
        <div className="space-y-4">
            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-2">
                    <User className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Personalidade do Agente</p>
                        <p>
                            Defina a personalidade, tom de voz, missão e regras de comportamento do agente.
                            Este texto será usado em todos os prompts enviados para a IA.
                        </p>
                    </div>
                </div>
            </div>

            {/* Editor */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Personalidade e Tom de Voz</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Defina como o agente deve se comportar, falar e interagir com os clientes
                    </p>
                </div>
                <div className="p-6 space-y-4">
                    <textarea
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value || null)}
                        placeholder={examplePersonality}
                        className="w-full min-h-[500px] p-4 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => onChange(null)}
                            disabled={value === null}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Limpar
                        </button>
                    </div>
                </div>
            </div>


        </div>
    );
}
