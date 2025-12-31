import { ChevronLeft, ChevronRight, Plus, Clock, Ban } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarHeaderProps {
    currentDate: Date;
    view: "month" | "week" | "day";
    onViewChange: (view: "month" | "week" | "day") => void;
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
    onNewEvent: () => void;
    onBlockTime: () => void;
    onConfigureHours: () => void;
}

export default function CalendarHeader({
    currentDate,
    view,
    onViewChange,
    onPrev,
    onNext,
    onToday,
    onNewEvent,
    onBlockTime,
    onConfigureHours,
}: CalendarHeaderProps) {
    const getTitle = () => {
        if (view === "month") {
            return format(currentDate, "MMMM yyyy", { locale: ptBR });
        }
        if (view === "week") {

            return `Semana de ${format(currentDate, "d 'de' MMMM", { locale: ptBR })}`;
        }
        if (view === "day") {
            return format(currentDate, "d 'de' MMMM, yyyy", { locale: ptBR });
        }
        return "";
    };

    return (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                        {getTitle()}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                        Gerencie sua agenda e disponibilidade
                    </p>
                </div>

                <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                    <button
                        onClick={onPrev}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-400 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onNext}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-400 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onToday}
                        className="ml-2 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                        Hoje
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    {(["month", "week", "day"] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => onViewChange(v)}
                            className={`
                px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-all
                ${view === v
                                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                }
              `}
                        >
                            {v === "month" ? "Mês" : v === "week" ? "Semana" : "Dia"}
                        </button>
                    ))}
                </div>

                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

                <div className="flex items-center gap-2">
                    <button
                        onClick={onConfigureHours}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Configurar Horários"
                    >
                        <Clock className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onBlockTime}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Bloquear Horário"
                    >
                        <Ban className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onNewEvent}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Agendar</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
