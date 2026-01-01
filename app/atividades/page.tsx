"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar, UserPlus, MessageSquare, FileText, Bell, Filter, ChevronDown } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import api from "@/app/lib/api-client";
import Loading from "../components/Loading";
import Error from "../components/Error";

interface ActivityLog {
    id: string;
    type: string;
    description: string;
    metadata: any;
    createdAt: string;
}

type ActivityType = "ALL" | "EVENT_SCHEDULED" | "LEAD_CREATED" | "FEEDBACK_RECEIVED" | "CONTRACT_SENT";
type PeriodFilter = "today" | "week" | "month" | "all";

export default function AtividadesPage() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const organizationId = searchParams.get("organizationId");

    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [typeFilter, setTypeFilter] = useState<ActivityType>("ALL");
    const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
    const [showTypeDropdown, setShowTypeDropdown] = useState(false);
    const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [organizationId]);

    useEffect(() => {
        applyFilters();
    }, [logs, typeFilter, periodFilter]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await api.activityLogs.list(organizationId || undefined, 100);
            setLogs(data);
        } catch (err) {
            console.error("Error fetching activity logs:", err);
            setError("Erro ao carregar atividades");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...logs];

        // Filter by type
        if (typeFilter !== "ALL") {
            filtered = filtered.filter((log) => log.type === typeFilter);
        }

        // Filter by period
        const now = new Date();
        if (periodFilter !== "all") {
            filtered = filtered.filter((log) => {
                const logDate = new Date(log.createdAt);
                const diffTime = now.getTime() - logDate.getTime();
                const diffDays = diffTime / (1000 * 60 * 60 * 24);

                switch (periodFilter) {
                    case "today":
                        return diffDays < 1;
                    case "week":
                        return diffDays < 7;
                    case "month":
                        return diffDays < 30;
                    default:
                        return true;
                }
            });
        }

        setFilteredLogs(filtered);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "EVENT_SCHEDULED":
                return <Calendar className="w-5 h-5 text-blue-500" />;
            case "LEAD_CREATED":
                return <UserPlus className="w-5 h-5 text-green-500" />;
            case "FEEDBACK_RECEIVED":
                return <MessageSquare className="w-5 h-5 text-yellow-500" />;
            case "CONTRACT_SENT":
                return <FileText className="w-5 h-5 text-purple-500" />;
            default:
                return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const getTypeLabel = (type: ActivityType) => {
        switch (type) {
            case "ALL":
                return "Todos os tipos";
            case "EVENT_SCHEDULED":
                return "Eventos agendados";
            case "LEAD_CREATED":
                return "Novos leads";
            case "FEEDBACK_RECEIVED":
                return "Feedbacks";
            case "CONTRACT_SENT":
                return "Contratos enviados";
            default:
                return type;
        }
    };

    const getPeriodLabel = (period: PeriodFilter) => {
        switch (period) {
            case "today":
                return "Hoje";
            case "week":
                return "Última semana";
            case "month":
                return "Último mês";
            case "all":
                return "Todo período";
            default:
                return period;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        // Less than an hour
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m atrás`;
        }
        // Less than a day
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h atrás`;
        }
        // Less than a week
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days}d atrás`;
        }
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <Loading />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <Error message={error} onRetry={fetchLogs} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Histórico de Atividades
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Acompanhe todas as atividades da sua organização
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
                    <div className="flex flex-wrap gap-3">
                        {/* Type Filter */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowTypeDropdown(!showTypeDropdown);
                                    setShowPeriodDropdown(false);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
                            >
                                <Filter className="w-4 h-4" />
                                {getTypeLabel(typeFilter)}
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {showTypeDropdown && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowTypeDropdown(false)}
                                    />
                                    <div className="absolute top-full mt-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 min-w-[200px]">
                                        {(["ALL", "EVENT_SCHEDULED", "LEAD_CREATED", "FEEDBACK_RECEIVED", "CONTRACT_SENT"] as ActivityType[]).map(
                                            (type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => {
                                                        setTypeFilter(type);
                                                        setShowTypeDropdown(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${typeFilter === type
                                                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                                                            : "text-gray-700 dark:text-gray-300"
                                                        }`}
                                                >
                                                    {getTypeLabel(type)}
                                                </button>
                                            )
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Period Filter */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowPeriodDropdown(!showPeriodDropdown);
                                    setShowTypeDropdown(false);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
                            >
                                {getPeriodLabel(periodFilter)}
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {showPeriodDropdown && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowPeriodDropdown(false)}
                                    />
                                    <div className="absolute top-full mt-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 min-w-[180px]">
                                        {(["today", "week", "month", "all"] as PeriodFilter[]).map((period) => (
                                            <button
                                                key={period}
                                                onClick={() => {
                                                    setPeriodFilter(period);
                                                    setShowPeriodDropdown(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${periodFilter === period
                                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                                                        : "text-gray-700 dark:text-gray-300"
                                                    }`}
                                            >
                                                {getPeriodLabel(period)}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Results count */}
                        <div className="ml-auto flex items-center text-sm text-gray-600 dark:text-gray-400">
                            {filteredLogs.length} {filteredLogs.length === 1 ? "atividade" : "atividades"}
                        </div>
                    </div>
                </div>

                {/* Activity List */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {filteredLogs.length === 0 ? (
                        <div className="p-12 text-center">
                            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <p className="text-gray-500 dark:text-gray-400">
                                Nenhuma atividade encontrada com os filtros selecionados
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 mt-1 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg h-fit">
                                            {getIcon(log.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-800 dark:text-gray-200 mb-1">
                                                {log.description}
                                            </p>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatTime(log.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
