"use client";

import { useState, useEffect } from "react";
import { Search, Filter, AlertCircle, CheckCircle, Star } from "lucide-react";
import Loading, { LoadingCard } from "../components/Loading";
import ErrorComponent from "../components/Error";
import EmptyState from "../components/EmptyState";
import FeedbackSidebar from "../components/FeedbackSidebar";
import FeedbackResponseModal from "../components/FeedbackResponseModal";
import { useToast, ToastContainer } from "../components/Toast";
import {
  getFeedbacksByStatus,
  getFeedbackMetrics,
  markAsResolved,
  reopenFeedback,
  type Feedback,
  type FeedbackMetrics,
} from "../services/feedbackService";
import { useSearchParams } from "next/navigation";

type TabType = "PENDING" | "RESOLVED";

export default function FeedbackPage() {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("organizationId");

  const [activeTab, setActiveTab] = useState<TabType>("PENDING");
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<Feedback[]>([]);
  const [metrics, setMetrics] = useState<FeedbackMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sidebar
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Response Modal
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [respondingFeedback, setRespondingFeedback] = useState<Feedback | null>(null);
  const [responseRefreshTrigger, setResponseRefreshTrigger] = useState(0);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);

  const { toasts, addToast, removeToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [feedbacksData, metricsData] = await Promise.all([
        getFeedbacksByStatus(organizationId || undefined, activeTab),
        getFeedbackMetrics(organizationId || undefined),
      ]);
      setFeedbacks(feedbacksData);
      setFilteredFeedbacks(feedbacksData);
      setMetrics(metricsData);
    } catch (err) {
      setError("Erro ao carregar feedbacks");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationId, activeTab]);

  // Apply filters
  useEffect(() => {
    let filtered = feedbacks;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (fb) =>
          fb.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fb.phone?.includes(searchTerm) ||
          fb.comment.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Severity filter
    if (severityFilter.length > 0) {
      filtered = filtered.filter((fb) =>
        severityFilter.includes(fb.severity || "MEDIUM")
      );
    }

    setFilteredFeedbacks(filtered);
  }, [searchTerm, severityFilter, feedbacks]);

  const handleOpenSidebar = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedFeedback(null);
  };

  const handleReopen = async (feedbackId: string) => {
    if (!confirm("Tem certeza que deseja reabrir este feedback?")) return;

    try {
      await reopenFeedback(feedbackId);
      addToast("Feedback reaberto com sucesso!", "success");
      handleCloseSidebar();
      loadData();
    } catch (err) {
      addToast("Erro ao reabrir feedback", "error");
      console.error(err);
    }
  };

  const handleResolve = async (feedbackId: string) => {
    if (!confirm("Tem certeza que este problema foi resolvido?")) return;

    try {
      await markAsResolved(feedbackId);
      addToast("Feedback marcado como resolvido!", "success");
      handleCloseSidebar();
      loadData();
    } catch (err) {
      addToast("Erro ao marcar como resolvido", "error");
      console.error(err);
    }
  };

  const handleRespond = (feedback: Feedback) => {
    setRespondingFeedback(feedback);
    setResponseModalOpen(true);
  };

  const handleSubmitResponse = async (feedbackId: string, response: string) => {
    try {
      const formData = new FormData();
      formData.append('response', response);

      const res = await fetch(`/api/feedback/${feedbackId}/respond`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to submit response');
      }

      addToast("Resposta enviada com sucesso!", "success");
      setResponseModalOpen(false);

      // Trigger response reload in sidebar
      setResponseRefreshTrigger(prev => prev + 1);

      // Reload feedback data to refresh the sidebar
      loadData();
    } catch (error) {
      addToast("Erro ao enviar resposta", "error");
      console.error(error);
      throw error;
    }
  };

  const handleDelete = async (feedbackId: string) => {
    if (!confirm("Tem certeza que deseja DELETAR este feedback? Esta ação não pode ser desfeita!")) return;

    try {
      const { deleteFeedback } = await import("../services/feedbackService");
      await deleteFeedback(feedbackId);
      addToast("Feedback deletado com sucesso!", "success");
      handleCloseSidebar();
      loadData();
    } catch (err) {
      addToast("Erro ao deletar feedback", "error");
      console.error(err);
    }
  };

  const toggleSeverityFilter = (severity: string) => {
    setSeverityFilter((prev) =>
      prev.includes(severity)
        ? prev.filter((s) => s !== severity)
        : [...prev, severity]
    );
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "CRITICAL":
        return "text-red-600 dark:text-red-400";
      case "HIGH":
        return "text-orange-600 dark:text-orange-400";
      case "MEDIUM":
        return "text-yellow-600 dark:text-yellow-400";
      case "LOW":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Feedbacks
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie os feedbacks dos usuários
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <LoadingCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex-1 p-6">
        <ErrorComponent message={error || "Erro ao carregar dados"} onRetry={loadData} />
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Feedbacks
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie os feedbacks reportados pelos usuários
          </p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-[#12121d] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Avaliação Média
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics.averageRating.toFixed(1)}
                  </span>
                  <div className="flex text-yellow-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.round(metrics.averageRating)
                          ? "fill-current"
                          : ""
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#12121d] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Total de Feedbacks
            </p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
              {metrics.totalFeedbacks}
            </p>
          </div>

          <div className="bg-white dark:bg-[#12121d] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Feedbacks em Aberto
            </p>
            <p className="text-2xl font-bold mt-1 text-yellow-600">
              {metrics.pendingCount}
            </p>
          </div>

          <div className="bg-white dark:bg-[#12121d] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Feedbacks Resolvidos
            </p>
            <p className="text-2xl font-bold mt-1 text-green-600">
              {metrics.resolvedCount}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab("PENDING")}
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === "PENDING"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
          >
            <AlertCircle className="w-4 h-4" />
            Em Aberto
            {metrics.pendingCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-semibold">
                {metrics.pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("RESOLVED")}
            className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === "RESOLVED"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
          >
            <CheckCircle className="w-4 h-4" />
            Resolvidos
            {metrics.resolvedCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-semibold">
                {metrics.resolvedCount}
              </span>
            )}
          </button>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou problema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Severity Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <Filter className="w-4 h-4" />
              Severidade:
            </span>
            {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((sev) => (
              <button
                key={sev}
                onClick={() => toggleSeverityFilter(sev)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${severityFilter.includes(sev)
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
              >
                {sev === "LOW" && "🟢 Baixa"}
                {sev === "MEDIUM" && "🟡 Média"}
                {sev === "HIGH" && "🟠 Alta"}
                {sev === "CRITICAL" && "🔴 Crítica"}
              </button>
            ))}
            {severityFilter.length > 0 && (
              <button
                onClick={() => setSeverityFilter([])}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* Feedbacks List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <EmptyState
            title={
              activeTab === "PENDING"
                ? "Nenhum feedback aberto"
                : "Nenhum feedback resolvido"
            }
            description={
              searchTerm || severityFilter.length > 0
                ? "Nenhum feedback encontrado com os filtros aplicados"
                : activeTab === "PENDING"
                  ? "Não há feedbacks pendentes no momento"
                  : "Não há feedbacks resolvidos ainda"
            }
            action={
              searchTerm || severityFilter.length > 0
                ? {
                  label: "Limpar filtros",
                  onClick: () => {
                    setSearchTerm("");
                    setSeverityFilter([]);
                  },
                }
                : {
                  label: "Atualizar",
                  onClick: loadData,
                }
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredFeedbacks.map((feedback) => (
              <div
                key={feedback.id}
                onClick={() => handleOpenSidebar(feedback)}
                className="bg-white dark:bg-[#12121d] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {feedback.customerName}
                      </h3>
                      {feedback.conversationId && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                          Com logs
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>{feedback.date}</span>
                      {feedback.phone && (
                        <>
                          <span>•</span>
                          <span>{feedback.phone}</span>
                        </>
                      )}
                      {feedback.currentState && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-xs">🧠 {feedback.currentState}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${feedback.severity === 'CRITICAL' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                      feedback.severity === 'HIGH' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                        feedback.severity === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                          'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                      {feedback.severity === 'CRITICAL' ? '🔴 Crítico' :
                        feedback.severity === 'HIGH' ? '🟠 Alto' :
                          feedback.severity === 'MEDIUM' ? '🟡 Médio' :
                            '🟢 Baixo'}
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-2 mb-3">
                  {feedback.comment}
                </p>

                {feedback.aiThinking && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs italic line-clamp-1">
                    💭 {feedback.aiThinking}
                  </p>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  {feedback.status === 'RESOLVED' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReopen(feedback.id);
                      }}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                    >
                      ↺ Reabrir Feedback
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Clique para ver detalhes completos →
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Sidebar */}
      <FeedbackSidebar
        feedback={selectedFeedback}
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        onRespond={handleRespond}
        onResolve={handleResolve}
        onReopen={handleReopen}
        onDelete={handleDelete}
        onResponseAdded={() => setResponseRefreshTrigger(prev => prev + 1)}
      />

      {/* Response Modal */}
      {respondingFeedback && (
        <FeedbackResponseModal
          isOpen={responseModalOpen}
          onClose={() => setResponseModalOpen(false)}
          feedbackId={respondingFeedback.id}
          customerName={respondingFeedback.customerName}
          feedbackComment={respondingFeedback.comment}
          onSubmit={handleSubmitResponse}
        />
      )}
    </>
  );
}
