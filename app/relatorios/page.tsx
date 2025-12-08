"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, Download, Share2, TrendingUp, DollarSign, Mic, Cpu, RefreshCw } from "lucide-react";
import Loading, { LoadingCard } from "../components/Loading";
import Error from "../components/Error";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import { useToast, ToastContainer } from "../components/Toast";
import { getReports, getReportMetrics, generateReport, downloadReport } from "../services/reportService";
import type { Report, ReportMetrics } from "../services/reportService";

import { useSearchParams } from "next/navigation";
import { useOrganization } from "../contexts/OrganizationContext";

export default function RelatoriosPage() {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("organizationId");
  const { selectedOrgId } = useOrganization();

  // Use selectedOrgId from context for costs (more reliable)
  const currentOrgId = selectedOrgId || organizationId;

  const [reports, setReports] = useState<Report[]>([]);
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Form state
  const [reportTitle, setReportTitle] = useState("");
  const [reportType, setReportType] = useState("Conversas");
  const [reportPeriod, setReportPeriod] = useState("Mensal");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [includeGraphs, setIncludeGraphs] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [format, setFormat] = useState("PDF");

  // Token Cost state
  const [costPeriod, setCostPeriod] = useState<"day" | "week" | "month">("month");
  const [openaiCosts, setOpenaiCosts] = useState<any>(null);
  const [elevenLabsCosts, setElevenLabsCosts] = useState<any>(null);
  const [loadingCosts, setLoadingCosts] = useState(false);

  const { toasts, addToast, removeToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [reportsData, metricsData] = await Promise.all([
        getReports(organizationId || undefined),
        getReportMetrics(organizationId || undefined),
      ]);
      setReports(reportsData);
      setMetrics(metricsData);
    } catch (err) {
      setError("Erro ao carregar relatórios");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCosts = useCallback(async () => {
    if (!currentOrgId) return;

    setLoadingCosts(true);
    try {
      const [openaiRes, elevenLabsRes] = await Promise.all([
        fetch(`/api/usage/openai?organizationId=${currentOrgId}&period=${costPeriod}`),
        fetch(`/api/usage/elevenlabs?organizationId=${currentOrgId}&period=${costPeriod}`),
      ]);

      if (openaiRes.ok) {
        const data = await openaiRes.json();
        setOpenaiCosts(data);
      }

      if (elevenLabsRes.ok) {
        const data = await elevenLabsRes.json();
        setElevenLabsCosts(data);
      }
    } catch (err) {
      console.error("Error loading costs:", err);
    } finally {
      setLoadingCosts(false);
    }
  }, [currentOrgId, costPeriod]);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  useEffect(() => {
    loadCosts();
  }, [loadCosts]);

  const resetForm = () => {
    setReportTitle("");
    setReportType("Conversas");
    setReportPeriod("Mensal");
    setStartDate("");
    setEndDate("");
    setIncludeGraphs(true);
    setIncludeDetails(true);
    setFormat("PDF");
  };

  const handleGenerateReport = async () => {
    if (!reportTitle.trim()) {
      addToast("Por favor, insira um título para o relatório", "error");
      return;
    }

    if (reportPeriod === "Personalizado" && (!startDate || !endDate)) {
      addToast("Por favor, selecione as datas de início e fim", "error");
      return;
    }

    try {
      setGenerating(true);
      await generateReport(reportType, reportPeriod);
      addToast("Relatório sendo gerado! Você será notificado quando estiver pronto.", "success");
      setShowGenerateModal(false);
      resetForm();
      loadData();
    } catch (err) {
      addToast("Erro ao gerar relatório", "error");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      await downloadReport(id);
      addToast("Download iniciado!", "success");
    } catch (err) {
      addToast("Erro ao fazer download", "error");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <div className="flex-1 flex flex-col min-h-screen">
          <div className="flex-1 p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Relatórios analíticos e métricas do sistema
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
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
            <Error message={error || "Erro ao carregar dados"} onRetry={loadData} />
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Relatórios analíticos e métricas do sistema
              </p>
            </div>

            {/* Filtros e Ações */}
            <div className="bg-white dark:bg-[#12121d] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <select className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white">
                    <option>Todos os Tipos</option>
                    <option>Conversas</option>
                    <option>Feedback</option>
                    <option>Performance</option>
                    <option>Atendimento</option>
                  </select>

                  <select className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white">
                    <option>Qualquer Período</option>
                    <option>Últimos 7 dias</option>
                    <option>Último mês</option>
                    <option>Último trimestre</option>
                  </select>
                </div>

                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="btn-primary whitespace-nowrap flex items-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  Gerar Novo Relatório
                </button>
              </div>
            </div>

            {/* Métricas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-indigo-100 text-sm">Relatórios Gerados</p>
                  <TrendingUp className="w-5 h-5 text-indigo-100" />
                </div>
                <p className="text-3xl font-bold mt-2">{metrics.relatoriosGerados}</p>
                <p className="text-indigo-100 text-sm mt-1">+{metrics.trends.gerados}% este mês</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-green-100 text-sm">Downloads</p>
                  <Download className="w-5 h-5 text-green-100" />
                </div>
                <p className="text-3xl font-bold mt-2">{metrics.totalDownloads}</p>
                <p className="text-green-100 text-sm mt-1">+{metrics.trends.downloads}% este mês</p>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-blue-100 text-sm">Tempo Médio</p>
                  <FileText className="w-5 h-5 text-blue-100" />
                </div>
                <p className="text-3xl font-bold mt-2">{metrics.tempoMedioGeracao}</p>
                <p className="text-blue-100 text-sm mt-1">{metrics.trends.tempo}% vs último mês</p>
              </div>
            </div>

            {/* Token Cost Section */}
            <div className="bg-white dark:bg-[#12121d] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Custo de Tokens
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Consumo de APIs OpenAI e ElevenLabs</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={costPeriod}
                    onChange={(e) => setCostPeriod(e.target.value as "day" | "week" | "month")}
                    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  >
                    <option value="day">Hoje</option>
                    <option value="week">Última Semana</option>
                    <option value="month">Último Mês</option>
                  </select>
                  <button
                    onClick={loadCosts}
                    disabled={loadingCosts}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Atualizar"
                  >
                    <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loadingCosts ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {!currentOrgId ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Selecione uma organização para ver os custos
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* OpenAI Card */}
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-5 h-5" />
                        <span className="font-medium">OpenAI</span>
                      </div>
                    </div>
                    {loadingCosts ? (
                      <div className="h-12 flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : openaiCosts?.configured ? (
                      <>
                        <p className="text-2xl font-bold">
                          ${openaiCosts?.totalCost?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-emerald-100 text-sm mt-1">
                          {openaiCosts?.startDate} a {openaiCosts?.endDate}
                        </p>
                      </>
                    ) : (
                      <p className="text-emerald-100 text-sm">Project ID não configurado</p>
                    )}
                  </div>

                  {/* ElevenLabs Card */}
                  <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Mic className="w-5 h-5" />
                        <span className="font-medium">ElevenLabs</span>
                      </div>
                    </div>
                    {loadingCosts ? (
                      <div className="h-12 flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : elevenLabsCosts?.configured ? (
                      <>
                        <p className="text-2xl font-bold">
                          {elevenLabsCosts?.usage?.charactersPerOrg?.toLocaleString() || 0} chars
                        </p>
                        <p className="text-violet-100 text-sm mt-1">
                          ~${elevenLabsCosts?.usage?.estimatedCostUSD || '0.00'} USD
                        </p>
                      </>
                    ) : (
                      <p className="text-violet-100 text-sm">API Key não configurada</p>
                    )}
                  </div>

                  {/* Total Card */}
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        <span className="font-medium">Total Estimado</span>
                      </div>
                    </div>
                    {loadingCosts ? (
                      <div className="h-12 flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-2xl font-bold">
                          ${
                            (
                              (openaiCosts?.totalCost || 0) +
                              parseFloat(elevenLabsCosts?.usage?.estimatedCostUSD || '0')
                            ).toFixed(2)
                          }
                        </p>
                        <p className="text-amber-100 text-sm mt-1">
                          {costPeriod === 'day' ? 'Hoje' : costPeriod === 'week' ? 'Última semana' : 'Este mês'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Lista de Relatórios */}
            {reports.length === 0 ? (
              <EmptyState
                title="Nenhum relatório encontrado"
                description="Você ainda não gerou nenhum relatório"
                action={{
                  label: "Gerar Relatório",
                  onClick: () => setShowGenerateModal(true),
                }}
              />
            ) : (
              <div className="bg-white dark:bg-[#12121d] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-lg font-semibold dark:text-white">Relatórios Recentes</h2>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-[#1a1a28] transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {report.title}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
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
                          <button
                            onClick={() => handleDownload(report.id)}
                            className="btn-primary text-sm flex items-center gap-2"
                            disabled={report.status !== "completed"}
                          >
                            <Download className="w-4 h-4" />
                            {report.status === "completed" ? "Baixar" : "Processando"}
                          </button>
                          <button className="btn-secondary text-sm flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
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
            )}
          </div>
        </div>
      </div>

      {/* Modal de Gerar Relatório */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => {
          setShowGenerateModal(false);
          resetForm();
        }}
        title="Gerar Novo Relatório"
        size="lg"
      >
        <div className="space-y-5">
          {/* Título do Relatório */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título do Relatório *
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Ex: Relatório Mensal de Conversas"
              className="input-primary"
            />
          </div>

          {/* Tipo e Período */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Relatório *
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="input-primary"
              >
                <option>Conversas</option>
                <option>Feedback</option>
                <option>Performance</option>
                <option>Atendimento</option>
                <option>Geral</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período *
              </label>
              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                className="input-primary"
              >
                <option>Semanal</option>
                <option>Mensal</option>
                <option>Trimestral</option>
                <option>Anual</option>
                <option>Personalizado</option>
              </select>
            </div>
          </div>

          {/* Datas Personalizadas */}
          {reportPeriod === "Personalizado" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Início *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Fim *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-primary"
                />
              </div>
            </div>
          )}

          {/* Formato */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formato de Exportação
            </label>
            <div className="grid grid-cols-3 gap-3">
              {["PDF", "Excel", "CSV"].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${format === fmt
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 font-medium"
                    : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Opções Adicionais */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Incluir no Relatório:</p>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeGraphs}
                onChange={(e) => setIncludeGraphs(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Gráficos e Visualizações</span>
                <p className="text-xs text-gray-500">Inclui gráficos de tendências e análises visuais</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDetails}
                onChange={(e) => setIncludeDetails(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Detalhamento Completo</span>
                <p className="text-xs text-gray-500">Inclui todas as métricas e dados detalhados</p>
              </div>
            </label>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setShowGenerateModal(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={generating}
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Gerar Relatório
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
