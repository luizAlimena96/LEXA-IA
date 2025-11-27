import CardResumo from "../components/CardResumo";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function DashboardPage() {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        <Topbar />

        <div className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Visão geral do seu desempenho</p>
          </div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <CardResumo
              title="Conversas Hoje"
              value={23}
              icon="💬"
              trend={{ value: 12, isPositive: true }}
            />
            <CardResumo
              title="Feedbacks Pendentes"
              value={7}
              icon="⭐"
              trend={{ value: 5, isPositive: false }}
            />
            <CardResumo
              title="Clientes Ativos"
              value={18}
              icon="👥"
              trend={{ value: 8, isPositive: true }}
            />
            <CardResumo
              title="Taxa de Resolução"
              value="94%"
              icon="🎯"
              trend={{ value: 3, isPositive: true }}
            />
          </div>

          {/* Gráficos e Métricas Adicionais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">
                Performance da IA
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Precisão de Respostas</span>
                    <span>89%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: "89%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Satisfação do Cliente</span>
                    <span>92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: "92%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Tempo Médio de Resposta</span>
                    <span>1.2s</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: "88%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">
                Atividade Recente
              </h3>
              <div className="space-y-3">
                {[
                  "Novo feedback recebido de João Silva",
                  "Conversa finalizada com Maria Santos",
                  "Relatório mensal gerado automaticamente",
                  "Atualização do modelo de IA aplicada",
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">{activity}</span>
                    <span className="text-gray-400 text-xs ml-auto">2h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
