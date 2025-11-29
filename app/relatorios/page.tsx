import Topbar from "../components/Topbar";

export default function RelatoriosPage() {
  const reports = [
    {
      id: 1,
      title: "Relatório de Conversas - Janeiro 2024",
      type: "Conversas",
      period: "01/01/2024 - 31/01/2024",
      status: "completed",
      downloads: 45,
    },
    {
      id: 2,
      title: "Análise de Feedback - Trimestre",
      type: "Feedback",
      period: "01/10/2023 - 31/12/2023",
      status: "completed",
      downloads: 23,
    },
    {
      id: 3,
      title: "Relatório de Performance IA",
      type: "Performance",
      period: "Semanal",
      status: "processing",
    },
  ];

  return (
    <div className="flex">
      <div className="flex-1 flex flex-col min-h-screen">
        <Topbar />

        <div className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-gray-600">
              Relatórios analíticos e métricas do sistema
            </p>
          </div>

          {/* Filtros e Ações */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <select className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>Todos os Tipos</option>
                  <option>Conversas</option>
                  <option>Feedback</option>
                  <option>Performance</option>
                </select>

                <select className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>Qualquer Período</option>
                  <option>Últimos 7 dias</option>
                  <option>Último mês</option>
                  <option>Último trimestre</option>
                </select>
              </div>

              <button className="btn-primary whitespace-nowrap">
                + Gerar Novo Relatório
              </button>
            </div>
          </div>

          {/* Métricas Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <p className="text-indigo-100 text-sm">Relatórios Gerados</p>
              <p className="text-3xl font-bold mt-2">156</p>
              <p className="text-indigo-100 text-sm mt-1">+12% este mês</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
              <p className="text-green-100 text-sm">Downloads</p>
              <p className="text-3xl font-bold mt-2">892</p>
              <p className="text-green-100 text-sm mt-1">+8% este mês</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white">
              <p className="text-blue-100 text-sm">Tempo Médio de Geração</p>
              <p className="text-3xl font-bold mt-2">2.3min</p>
              <p className="text-blue-100 text-sm mt-1">-15% vs último mês</p>
            </div>
          </div>

          {/* Lista de Relatórios */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Relatórios Recentes</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {report.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                          {report.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>📅</span>
                          {report.period}
                        </span>
                        {report.downloads && (
                          <span className="flex items-center gap-1">
                            <span>📥</span>
                            {report.downloads} downloads
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="btn-primary text-sm">
                        {report.status === "completed"
                          ? "Baixar"
                          : "Visualizar"}
                      </button>
                      <button className="btn-secondary text-sm">
                        Compartilhar
                      </button>
                    </div>
                  </div>

                  {report.status === "processing" && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
                      <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Processando...
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
