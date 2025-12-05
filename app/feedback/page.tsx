"use client";

import { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, X, Send, Paperclip } from "lucide-react";
import Loading, { LoadingCard } from "../components/Loading";
import ErrorComponent from "../components/Error";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import { useToast, ToastContainer } from "../components/Toast";
import { getFeedbacks, getFeedbackMetrics, respondToFeedback, markAsResolved } from "../services/feedbackService";
import type { Feedback, FeedbackMetrics } from "../services/feedbackService";

import { useSearchParams } from "next/navigation";

export default function FeedbackPage() {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("organizationId");

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [metrics, setMetrics] = useState<FeedbackMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responseImages, setResponseImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toasts, addToast, removeToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [feedbacksData, metricsData] = await Promise.all([
        getFeedbacks(organizationId || undefined),
        getFeedbackMetrics(organizationId || undefined),
      ]);
      setFeedbacks(feedbacksData);
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
  }, [organizationId]);

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

  const handleOpenResponseModal = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setResponseText("");
    setResponseImages([]);
    setImagePreviews([]);
    setShowResponseModal(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...responseImages, ...files].slice(0, 5); // Máximo 5 imagens
    setResponseImages(newImages);

    // Criar previews
    const previews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = responseImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setResponseImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSendResponse = async () => {
    if (!selectedFeedback || (!responseText.trim() && responseImages.length === 0)) {
      addToast("Por favor, adicione uma mensagem ou imagem", "error");
      return;
    }

    try {
      await respondToFeedback(selectedFeedback.id, responseText, responseImages);
      addToast("Resposta enviada com sucesso!", "success");
      setShowResponseModal(false);
      setSelectedFeedback(null);
      setResponseText("");
      setResponseImages([]);
      setImagePreviews([]);
      loadData();
    } catch (err) {
      addToast("Erro ao enviar resposta", "error");
      console.error(err);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await markAsResolved(id);
      addToast("Feedback marcado como resolvido!", "success");
      loadData();
    } catch (err) {
      addToast("Erro ao marcar como resolvido", "error");
      console.error(err);
    }
  };

  const handleSeverityChange = async (id: string, severity: string) => {
    try {
      const res = await fetch(`/api/feedback/${id}/severity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ severity }),
      });

      if (!res.ok) {
        throw new Error('Failed to update severity');
      }

      addToast("Severidade atualizada!", "success");
      loadData();
    } catch (err) {
      addToast("Erro ao atualizar severidade", "error");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <div className="flex-1 flex flex-col min-h-screen">
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Problemas Reportados
              </h1>
              <p className="text-gray-600">
                Gerencie os problemas reportados pelos usuários
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex">
        <div className="flex-1 flex flex-col min-h-screen">
          <div className="flex-1 p-6">
            <ErrorComponent message={error || "Erro ao carregar dados"} onRetry={loadData} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="flex">
        <div className="flex-1 flex flex-col min-h-screen">
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Problemas Reportados
              </h1>
              <p className="text-gray-600">
                Gerencie os problemas reportados pelos usuários
              </p>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Severidade Média</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold">{metrics.averageRating}</span>
                      <div className="flex text-red-400">
                        {"★".repeat(Math.floor(metrics.averageRating))}
                        <span className="text-gray-300">★</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <span className="text-white text-lg">⚠️</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-gray-600 text-sm">Total de Problemas</p>
                <p className="text-2xl font-bold mt-1">{metrics.totalFeedbacks}</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-gray-600 text-sm">Críticos</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{metrics.positivePercentage}%</p>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-gray-600 text-sm">Resolvidos</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{metrics.responseRate}%</p>
              </div>
            </div>

            {/* Lista de Problemas */}
            {feedbacks.length === 0 ? (
              <EmptyState
                title="Nenhum problema reportado"
                description="Não há problemas reportados no momento"
                action={{
                  label: "Atualizar",
                  onClick: loadData,
                }}
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">Problemas Recentes</h2>
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
                            {feedback.customerName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex text-red-400">
                              {"★".repeat(feedback.rating)}
                              {"☆".repeat(5 - feedback.rating)}
                            </div>
                            <span className="text-xs text-gray-400">Severidade</span>
                            <span className="text-sm text-gray-500">
                              {feedback.date}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            feedback.status || 'pending'
                          )}`}
                        >
                          {getStatusText(feedback.status || 'pending')}
                        </span>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                        <p className="text-gray-700 font-medium mb-1">Descrição do Problema:</p>
                        <p className="text-gray-600">{feedback.comment}</p>
                      </div>

                      {/* Severity Selector */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Severidade
                        </label>
                        <select
                          value={feedback.severity || 'MEDIUM'}
                          onChange={(e) => handleSeverityChange(feedback.id, e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        >
                          <option value="LOW">🟢 Baixa</option>
                          <option value="MEDIUM">🟡 Média</option>
                          <option value="HIGH">🟠 Alta</option>
                          <option value="CRITICAL">🔴 Crítica</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenResponseModal(feedback)}
                          className="btn-primary text-sm flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Responder
                        </button>
                        <button
                          onClick={() => handleResolve(feedback.id)}
                          className="btn-secondary text-sm"
                        >
                          Marcar como Resolvido
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Resposta */}
      <Modal
        isOpen={showResponseModal}
        onClose={() => setShowResponseModal(false)}
        title={`Responder Problema - ${selectedFeedback?.customerName}`}
        size="lg"
      >
        <div className="space-y-4">
          {/* Problema Original */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Problema Reportado:</p>
            <p className="text-gray-900">{selectedFeedback?.comment}</p>
          </div>

          {/* Campo de Texto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sua Resposta
            </label>
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Digite sua resposta aqui..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900"
            />
          </div>

          {/* Upload de Imagens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anexar Imagens (opcional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-indigo-500 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-indigo-600"
              disabled={responseImages.length >= 5}
            >
              <Paperclip className="w-5 h-5" />
              <span>Clique para adicionar imagens (máx. 5)</span>
            </button>
          </div>

          {/* Preview de Imagens */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowResponseModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSendResponse}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Enviar Resposta
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
