"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText, Download, Share2, TrendingUp, DollarSign, Mic, Cpu, RefreshCw,
  MessageSquare, Calendar, Users, Clock, Zap, Target, BarChart3
} from "lucide-react";
import Loading, { LoadingCard } from "../components/Loading";
import Error from "../components/Error";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import { useToast, ToastContainer } from "../components/Toast";
import type { Report, ReportMetrics } from "../types";
import api from "../lib/api-client";

// API wrapper functions - replacing deleted reportService
const getReports = async (organizationId?: string): Promise<Report[]> => {
  try {
    const data = await api.reports.list(organizationId);
    return data || [];
  } catch {
    return [];
  }
};

const getReportMetrics = async (organizationId?: string): Promise<ReportMetrics> => {
  try {
    const data = await api.reports.metrics(organizationId);
    return data || { totalReports: 0, completedReports: 0, pendingReports: 0 };
  } catch {
    return { totalReports: 0, completedReports: 0, pendingReports: 0 };
  }
};

const generateReport = async (type: string, period: string, options: any): Promise<void> => {
  await api.reports.generate({ type, period, ...options });
};

const downloadReport = async (id: string): Promise<void> => {
  await api.reports.download(id);
};

import { useSearchParams } from "next/navigation";
import { useOrganization } from "../contexts/OrganizationContext";

interface AIMetrics {
  conversations: number;
  appointments: number;
  conversionRate: number;
  followupsSent: number;
  qualifiedLeads: number;
  totalMessages: number;
  timeSavedMinutes: number;
  timeSavedFormatted: string;
  messagesPerState: { state: string; count: number }[];
}

export default function RelatoriosPage() {
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("organizationId");
  const { selectedOrgId } = useOrganization();

  const currentOrgId = selectedOrgId || organizationId;

  const [reports, setReports] = useState<Report[]>([]);
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [aiMetrics, setAiMetrics] = useState<AIMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAIMetrics, setLoadingAIMetrics] = useState(false);
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

  // AI Metrics period
  const [aiMetricsPeriod, setAiMetricsPeriod] = useState<"day" | "week" | "month" | "all">("month");

  // Token Cost state
  const [costPeriod, setCostPeriod] = useState<"day" | "week" | "month" | "lastMonth" | "custom">("month");
  const [openaiCosts, setOpenaiCosts] = useState<any>(null);
  const [elevenLabsCosts, setElevenLabsCosts] = useState<any>(null);
  const [loadingCosts, setLoadingCosts] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const { toasts, addToast, removeToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load reports and legacy metrics independently to avoid one failing the other
      const [reportsResult, metricsResult] = await Promise.allSettled([
        getReports(currentOrgId || undefined),
        getReportMetrics(currentOrgId || undefined),
      ]);

      if (reportsResult.status === 'fulfilled') {
        setReports(reportsResult.value);
      } else {
        console.error("Failed to load reports:", reportsResult.reason);
        setReports([]);
      }

      if (metricsResult.status === 'fulfilled') {
        setMetrics(metricsResult.value);
      } else {
        console.error("Failed to load metrics:", metricsResult.reason);
        // Fallback stub if metrics fail
        setMetrics({
          totalReports: 0,
          completedReports: 0,
          pendingReports: 0,
          relatoriosGerados: 0,
          totalDownloads: 0,
          tempoMedioGeracao: '0s',
          trends: { gerados: 0, downloads: 0, tempo: 0 }
        });
      }
    } catch (err) {
      console.error("Unexpected error in loadData:", err);
      // Don't block the UI, just start with empty main data
    } finally {
      setLoading(false);
    }
  };

  const loadAIMetrics = useCallback(async () => {
    console.log("Loading AI Metrics for org:", currentOrgId, "period:", aiMetricsPeriod);
    if (!currentOrgId) return;

    setLoadingAIMetrics(true);
    try {
      const data = await api.reports.aiMetrics(currentOrgId, aiMetricsPeriod);
      console.log("AI Metrics Loaded:", data);
      setAiMetrics(data);
    } catch (err) {
      console.error("Error loading AI metrics:", err);
    } finally {
      setLoadingAIMetrics(false);
    }
  }, [currentOrgId, aiMetricsPeriod]);

  const loadCosts = useCallback(async () => {
    console.log("Loading Costs for org:", currentOrgId);
    if (!currentOrgId) return;

    if (costPeriod === 'custom' && (!customStartDate || !customEndDate)) return;

    setLoadingCosts(true);
    try {
      const [openaiData, elevenLabsData] = await Promise.all([
        api.usage.openai(currentOrgId, costPeriod, customStartDate, customEndDate),
        api.usage.elevenlabs(currentOrgId, costPeriod, customStartDate, customEndDate),
      ]);

      setOpenaiCosts(openaiData);
      setElevenLabsCosts(elevenLabsData);
    } catch (err) {
      console.error("Error loading costs:", err);
    } finally {
      setLoadingCosts(false);
    }
  }, [currentOrgId, costPeriod, customStartDate, customEndDate]);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  useEffect(() => {
    loadCosts();
  }, [loadCosts]);

  useEffect(() => {
    loadAIMetrics();
  }, [loadAIMetrics]);

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
      await generateReport(reportType, reportPeriod, {
        title: reportTitle,
        startDate: reportPeriod === "Personalizado" ? startDate : undefined,
        endDate: reportPeriod === "Personalizado" ? endDate : undefined,
        includeGraphs,
        includeDetails,
        format,
        organizationId: currentOrgId
      });
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
                Métricas de performance da IA e custos
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Métricas de performance da IA e custos
                </p>
              </div>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="btn-primary whitespace-nowrap flex items-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Gerar Relatório
              </button>
            </div>

            {/* AI Metrics Section */}
            <div className="bg-white dark:bg-[#12121d] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    Métricas de Performance
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Análise de conversas e produtividade da IA</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={aiMetricsPeriod}
                    onChange={(e) => setAiMetricsPeriod(e.target.value as "day" | "week" | "month" | "all")}
                    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  >
                    <option value="day">Hoje</option>
                    <option value="week">Última Semana</option>
                    <option value="month">Este Mês</option>
                    <option value="all">Todo o Período</option>
                  </select>
                  <button
                    onClick={loadAIMetrics}
                    disabled={loadingAIMetrics}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                    title="Atualizar"
                  >
                    <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loadingAIMetrics ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {!currentOrgId ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Selecione uma organização para ver as métricas
                </div>
              ) : (
                <>
                  {/* Main Metrics Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Conversas */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-5 h-5 opacity-80" />
                        <span className="text-sm opacity-90">Conversas</span>
                      </div>
                      {loadingAIMetrics ? (
                        <div className="h-8 flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <p className="text-3xl font-bold">{aiMetrics?.conversations || 0}</p>
                      )}
                    </div>

                    {/* Agendamentos */}
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 opacity-80" />
                        <span className="text-sm opacity-90">Agendamentos</span>
                      </div>
                      {loadingAIMetrics ? (
                        <div className="h-8 flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <p className="text-3xl font-bold">{aiMetrics?.appointments || 0}</p>
                      )}
                    </div>

                    {/* Taxa de Conversão */}
                    <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl p-5 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 opacity-80" />
                        <span className="text-sm opacity-90">Conversão</span>
                      </div>
                      {loadingAIMetrics ? (
                        <div className="h-8 flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <p className="text-3xl font-bold">{aiMetrics?.conversionRate || 0}%</p>
                      )}
                    </div>

                    {/* Follow-ups */}
                    <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-5 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 opacity-80" />
                        <span className="text-sm opacity-90">Follow-ups</span>
                      </div>
                      {loadingAIMetrics ? (
                        <div className="h-8 flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <p className="text-3xl font-bold">{aiMetrics?.followupsSent || 0}</p>
                      )}
                    </div>
                  </div>

                  {/* Secondary Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Leads Qualificados */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Leads Qualificados</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Leads com 3+ dados coletados</p>
                        </div>
                        {loadingAIMetrics ? (
                          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">{aiMetrics?.qualifiedLeads || 0}</p>
                        )}
                      </div>
                    </div>

                    {/* Tempo Economizado */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tempo Economizado</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{aiMetrics?.totalMessages || 0} msgs × 45seg médio</p>
                        </div>
                        {loadingAIMetrics ? (
                          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <p className="text-3xl font-bold text-gray-900 dark:text-white">{aiMetrics?.timeSavedFormatted || '0 min'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Token Cost Section - MANTIDO INTACTO */}
            <div className="bg-white dark:bg-[#12121d] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Custo de Tokens
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Consumo de APIs OpenAI e ElevenLabs</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={costPeriod}
                    onChange={(e) => setCostPeriod(e.target.value as "day" | "week" | "month" | "lastMonth" | "custom")}
                    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                  >
                    <option value="day">Hoje</option>
                    <option value="week">Última Semana</option>
                    <option value="month">Este Mês</option>
                    <option value="lastMonth">Mês Anterior</option>
                    <option value="custom">Personalizado</option>
                  </select>
                  {costPeriod === 'custom' && (
                    <>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                        placeholder="dd/mm/aaaa"
                      />
                      <span className="text-gray-500 dark:text-gray-400 text-sm">até</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1a1a28] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                        placeholder="dd/mm/aaaa"
                      />
                    </>
                  )}
                  <button
                    onClick={loadCosts}
                    disabled={loadingCosts || (costPeriod === 'custom' && (!customStartDate || !customEndDate))}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
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
                      <>
                        <p className="text-2xl font-bold">$12.45</p>
                        <p className="text-emerald-100 text-sm mt-1">
                          Dados de exemplo
                        </p>
                        <p className="text-emerald-200 text-xs mt-2 opacity-75">
                          Configure OpenAI Project ID para ver dados reais
                        </p>
                      </>
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
                      <>
                        <p className="text-2xl font-bold">45,230 chars</p>
                        <p className="text-violet-100 text-sm mt-1">
                          ~$5.42 USD (exemplo)
                        </p>
                        <p className="text-violet-200 text-xs mt-2 opacity-75">
                          Configure ElevenLabs API Key para ver dados reais
                        </p>
                      </>
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
                              (openaiCosts?.configured ? openaiCosts?.totalCost || 0 : 12.45) +
                              (elevenLabsCosts?.configured ? parseFloat(elevenLabsCosts?.usage?.estimatedCostUSD || '0') : 5.42)
                            ).toFixed(2)
                          }
                        </p>
                        <p className="text-amber-100 text-sm mt-1">
                          {costPeriod === 'day' ? 'Hoje' :
                            costPeriod === 'week' ? 'Última semana' :
                              costPeriod === 'lastMonth' ? 'Mês anterior' :
                                costPeriod === 'custom' ? `${customStartDate} a ${customEndDate}` :
                                  'Este mês'}
                        </p>
                        {(!openaiCosts?.configured || !elevenLabsCosts?.configured) && (
                          <p className="text-amber-200 text-xs mt-2 opacity-75">
                            {!openaiCosts?.configured && !elevenLabsCosts?.configured
                              ? 'Valores de exemplo - configure as APIs'
                              : 'Parcialmente configurado'}
                          </p>
                        )}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Formato de Exportação
            </label>
            <div className="grid grid-cols-3 gap-3">
              {["PDF", "Excel", "CSV"].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${format === fmt
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium"
                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Opções Adicionais */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Incluir no Relatório:</p>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeGraphs}
                onChange={(e) => setIncludeGraphs(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Gráficos e Visualizações</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Inclui gráficos de tendências e análises visuais</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDetails}
                onChange={(e) => setIncludeDetails(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Detalhamento Completo</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">Inclui todas as métricas e dados detalhados</p>
              </div>
            </label>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setShowGenerateModal(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
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
