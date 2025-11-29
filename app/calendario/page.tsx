"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Users,
  MapPin,
  Video,
} from "lucide-react";

interface Event {
  id: number;
  title: string;
  date: Date;
  time: string;
  duration: string;
  type: "meeting" | "call" | "event";
  attendees?: number;
  location?: string;
  color: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const events: Event[] = [
    {
      id: 1,
      title: "Reunião com Cliente",
      date: new Date(2024, 10, 15, 10, 0),
      time: "10:00",
      duration: "1h",
      type: "meeting",
      attendees: 5,
      location: "Sala 3",
      color: "bg-blue-500",
    },
    {
      id: 2,
      title: "Demonstração do Produto",
      date: new Date(2024, 10, 15, 14, 0),
      time: "14:00",
      duration: "2h",
      type: "event",
      attendees: 12,
      color: "bg-purple-500",
    },
    {
      id: 3,
      title: "Call com Fornecedor",
      date: new Date(2024, 10, 20, 9, 0),
      time: "09:00",
      duration: "30min",
      type: "call",
      color: "bg-green-500",
    },
  ];

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDay = (date: Date | null) => {
    if (!date) return [];
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    );
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Calendário
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie seus compromissos e eventos
            </p>
          </div>
          <button
            onClick={() => setShowEventModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Evento</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendário */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              {/* Header do Calendário */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {monthNames[currentDate.getMonth()]}{" "}
                  {currentDate.getFullYear()}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={previousMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Dias da Semana */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Grid de Dias */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  const isToday =
                    day &&
                    day.getDate() === today.getDate() &&
                    day.getMonth() === today.getMonth() &&
                    day.getFullYear() === today.getFullYear();

                  const dayEvents = getEventsForDay(day);
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <button
                      key={index}
                      onClick={() => day && setSelectedDate(day)}
                      className={`
                        aspect-square p-2 rounded-lg transition-all relative
                        ${!day ? "invisible" : ""}
                        ${isToday ? "bg-indigo-600 text-white font-bold" : ""}
                        ${
                          !isToday && day
                            ? "hover:bg-gray-100 dark:hover:bg-gray-700"
                            : ""
                        }
                        ${
                          selectedDate?.getDate() === day?.getDate() &&
                          selectedDate?.getMonth() === day?.getMonth() &&
                          !isToday
                            ? "ring-2 ring-indigo-600 dark:ring-indigo-400"
                            : ""
                        }
                      `}
                    >
                      {day && (
                        <>
                          <span
                            className={`text-sm ${
                              isToday ? "" : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {day.getDate()}
                          </span>
                          {hasEvents && (
                            <div className="flex justify-center mt-1 space-x-1">
                              {dayEvents.slice(0, 3).map((event) => (
                                <div
                                  key={event.id}
                                  className={`w-1.5 h-1.5 rounded-full ${event.color}`}
                                />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Lista de Eventos */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Próximos Eventos
              </h3>

              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-1 h-full ${event.color} rounded-full`}
                      ></div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {event.title}
                        </h4>

                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {event.date.toLocaleDateString("pt-BR")} às{" "}
                              {event.time}
                            </span>
                          </div>

                          {event.attendees && (
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4" />
                              <span>{event.attendees} participantes</span>
                            </div>
                          )}

                          {event.location && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>

                        {event.type === "call" && (
                          <button className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                            <Video className="w-4 h-4" />
                            <span>Entrar na Chamada</span>
                          </button>
                        )}
                      </div>
                    </div>
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
