import Topbar from "../components/Topbar";

export default function FeedbackPage() {
  const feedbacks = [
    {
      id: 1,
      client: "João Silva",
      rating: 5,
      comment: "Atendimento excelente, muito rápido e eficiente!",
      date: "2024-01-15",
      status: "positive",
    },
    {
      id: 2,
      client: "Maria Santos",
      rating: 3,
      comment: "Bom atendimento, mas poderia ser mais ágil",
      date: "2024-01-14",
      status: "neutral",
    },
    {
      id: 3,
      client: "Pedro Costa",
      rating: 1,
      comment: "Não resolveu meu problema, preciso de ajuda urgente",
      date: "2024-01-14",
      status: "negative",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "positive":
        return "bg-green-100 text-green-800";
      case "negative":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "positive":
        return "Positivo";
      case "negative":
        return "Negativo";
      default:
        return "Neutro";
    }
  };

  return (
    <div className="flex">
      <div className="flex-1 flex flex-col min-h-screen">
        <Topbar />

        <div className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Feedback dos Clientes
            </h1>
            <p className="text-gray-600">
              Avaliações e comentários dos seus clientes
            </p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Avaliação Média</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold">4.2</span>
                    <div className="flex text-yellow-400">
                      {"★".repeat(4)}
                      <span className="text-gray-300">★</span>
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">⭐</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-gray-600 text-sm">Total de Avaliações</p>
              <p className="text-2xl font-bold mt-1">156</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-gray-600 text-sm">Positivas</p>
              <p className="text-2xl font-bold mt-1 text-green-600">78%</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-gray-600 text-sm">Respondidos</p>
              <p className="text-2xl font-bold mt-1">92%</p>
            </div>
          </div>

          {/* Lista de Feedbacks */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Últimos Feedbacks</h2>
            </div>

            <div className="divide-y divide-gray-200">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {feedback.client}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex text-yellow-400">
                          {"★".repeat(feedback.rating)}
                          {"☆".repeat(5 - feedback.rating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {feedback.date}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        feedback.status
                      )}`}
                    >
                      {getStatusText(feedback.status)}
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4">{feedback.comment}</p>

                  <div className="flex gap-2">
                    <button className="btn-primary text-sm">Responder</button>
                    <button className="btn-secondary text-sm">
                      Marcar como Resolvido
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
