"use client";

import { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Users,
  MapPin,
  Video,
  Link as LinkIcon,
  X,
  Ban,
  Save,
} from "lucide-react";
import Loading from "../components/Loading";
import Error from "../components/Error";
import Modal from "../components/Modal";
import { useToast, ToastContainer } from "../components/Toast";
import { getEvents, createEvent, getBlockedSlots, createBlockedSlot, deleteBlockedSlot } from "../services/calendarService";
import type { Event, BlockedSlot } from "../services/calendarService";
import { getAgentConfig, updateAgentConfig, type AgentConfig } from "../services/agentService";

import { useSession } from "next-auth/react";

import { useSearchParams } from "next/navigation";

export default function CalendarPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("organizationId");

  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showBlockDayModal, setShowBlockDayModal] = useState(false);
  const [showBlockTimeModal, setShowBlockTimeModal] = useState(false);
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);

  const [events, setEvents] = useState<Event[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state para criar evento
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventDuration, setEventDuration] = useState("1h");
  const [eventType, setEventType] = useState<"meeting" | "call" | "other">("meeting");
  const [eventAttendees, setEventAttendees] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventMeetingLink, setEventMeetingLink] = useState("");

  const { toasts, addToast, removeToast } = useToast();

  // State for Block Time Modal
  const [blockDate, setBlockDate] = useState("");
  const [blockStartTime, setBlockStartTime] = useState("");
  const [blockEndTime, setBlockEndTime] = useState("");
  const [blockTitle, setBlockTitle] = useState("");

  // State for Working Hours Modal (supports 2-4 shifts per day)
  const [workingShifts, setWorkingShifts] = useState<Record<string, Array<{ start: string; end: string }>>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [eventsData, blockedData, agentData] = await Promise.all([
        getEvents(organizationId || undefined),
        getBlockedSlots(organizationId || undefined),
        getAgentConfig(organizationId || undefined)
      ]);
      // Fetch Google Calendar events if organizationId is available
      let googleEvents: Event[] = [];
      if (organizationId) {
        try {
          const googleResponse = await fetch(`/api/calendar/google-events?organizationId=${organizationId}`, {
            credentials: 'include'
          });

          if (googleResponse.ok) {
            const googleEventsData = await googleResponse.json();

            // Convert Google Calendar events to Event format
            googleEvents = googleEventsData.map((evt: any) => ({
              id: evt.id,
              title: evt.summary || 'Sem título',
              date: new Date(evt.startTime),
              time: new Date(evt.startTime).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              }),
              type: 'meeting' as const,
              description: evt.description,
              location: evt.location,
              color: 'bg-blue-500', // Google blue for Google Calendar events
            }));
          }
        } catch (googleErr) {
          console.error('Error fetching Google Calendar events:', googleErr);
          // Continue without Google events if there's an error
        }
      }
      // Merge local appointments with Google Calendar events
      const allEvents = [...eventsData, ...googleEvents]
        .filter(evt => evt.date >= new Date()) // Only future events
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 10); // Show only next 10 events
      setEvents(allEvents);
      setBlockedSlots(blockedData);
      if (agentData && agentData.length > 0) {
        setAgentConfig(agentData[0]);
        setWorkingShifts(agentData[0].workingHours || {});
      }
    } catch (err) {
      setError("Erro ao carregar dados do calendário");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
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

  const isDayBlocked = (date: Date | null) => {
    if (!date) return false;
    return blockedSlots.some(slot =>
      slot.allDay &&
      slot.startTime.getDate() === date.getDate() &&
      slot.startTime.getMonth() === date.getMonth() &&
      slot.startTime.getFullYear() === date.getFullYear()
    );
  };

  const handleBlockDay = async (date: Date) => {
    if (!session?.user?.organizationId) return;

    const existingSlot = blockedSlots.find(slot =>
      slot.allDay &&
      slot.startTime.getDate() === date.getDate() &&
      slot.startTime.getMonth() === date.getMonth() &&
      slot.startTime.getFullYear() === date.getFullYear()
    );

    try {
      if (existingSlot) {
        await deleteBlockedSlot(existingSlot.id);
        setBlockedSlots(blockedSlots.filter(s => s.id !== existingSlot.id));
        addToast("Dia desbloqueado!", "success");
      } else {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const newSlot = await createBlockedSlot({
          startTime: start,
          endTime: end,
          allDay: true,
          title: "Dia Bloqueado"
        }, session.user.organizationId);

        setBlockedSlots([...blockedSlots, newSlot]);
        addToast("Dia bloqueado para agendamentos!", "success");
      }
    } catch (error) {
      addToast("Erro ao alterar bloqueio do dia", "error");
    }
  };

  const handleBlockTime = async () => {
    if (!blockDate || !blockStartTime || !blockEndTime || !session?.user?.organizationId) {
      addToast("Preencha todos os campos", "error");
      return;
    }

    try {
      const start = new Date(`${blockDate}T${blockStartTime}`);
      const end = new Date(`${blockDate}T${blockEndTime}`);

      if (start >= end) {
        addToast("A hora de início deve ser anterior à hora de término", "error");
        return;
      }

      const newSlot = await createBlockedSlot({
        startTime: start,
        endTime: end,
        allDay: false,
        title: blockTitle || "Horário Bloqueado"
      }, session.user.organizationId);

      setBlockedSlots([...blockedSlots, newSlot]);
      addToast("Horário bloqueado com sucesso!", "success");
      setShowBlockTimeModal(false);
      setBlockDate("");
      setBlockStartTime("");
      setBlockEndTime("");
      setBlockTitle("");
    } catch (error) {
      console.error('Error:', error);
      addToast("Erro ao atualizar horários", "error");
    }
  };

  const handleUpdateWorkingHours = async () => {
    if (!agentConfig) {
      addToast("Erro: Agente não encontrado", "error");
      return;
    }

    try {
      const result = await updateAgentConfig(agentConfig.id, { workingHours: workingShifts });
      setAgentConfig({ ...agentConfig, workingHours: workingShifts });
      addToast("Horários de atendimento atualizados!", "success");
      setShowWorkingHoursModal(false);
    } catch (error) {
      console.error('Error updating working hours:', error);
      addToast("Erro ao atualizar horários", "error");
    }
  };

  const addShift = (day: string) => {
    const currentShifts = workingShifts[day] || [];
    if (currentShifts.length >= 4) {
      addToast("Máximo de 4 turnos por dia", "error");
      return;
    }
    setWorkingShifts({
      ...workingShifts,
      [day]: [...currentShifts, { start: "08:00", end: "12:00" }]
    });
  };

  const removeShift = (day: string, index: number) => {
    const currentShifts = workingShifts[day] || [];
    const newShifts = currentShifts.filter((_, i) => i !== index);
    if (newShifts.length === 0) {
      const { [day]: removed, ...rest } = workingShifts;
      setWorkingShifts(rest);
    } else {
      setWorkingShifts({ ...workingShifts, [day]: newShifts });
    }
  };

  const updateShift = (day: string, index: number, field: 'start' | 'end', value: string) => {
    const currentShifts = workingShifts[day] || [];
    const newShifts = [...currentShifts];
    newShifts[index] = { ...newShifts[index], [field]: value };
    setWorkingShifts({ ...workingShifts, [day]: newShifts });
  };

  const resetEventForm = () => {
    setEventTitle("");
    setEventDate("");
    setEventTime("");
    setEventDuration("1h");
    setEventType("meeting");
    setEventAttendees("");
    setEventLocation("");
    setEventMeetingLink("");
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim() || !eventDate || !eventTime) {
      addToast("Por favor, preencha os campos obrigatórios", "error");
      return;
    }

    try {
      const [year, month, day] = eventDate.split('-').map(Number);
      const [hours, minutes] = eventTime.split(':').map(Number);

      const newEvent: Omit<Event, 'id'> = {
        title: eventTitle,
        date: new Date(year, month - 1, day, hours, minutes),
        time: eventTime,
        duration: eventDuration,
        type: eventType,
        attendees: eventAttendees ? parseInt(eventAttendees) : undefined,
        location: eventLocation || undefined,
        color: eventType === 'meeting' ? 'bg-blue-500' : eventType === 'call' ? 'bg-green-500' : 'bg-purple-500',
      };

      if (!session?.user?.organizationId) {
        addToast("Erro: Organização não encontrada", "error");
        return;
      }

      await createEvent(newEvent, session.user.organizationId);
      addToast("Evento criado com sucesso!", "success");
      setShowEventModal(false);
      resetEventForm();
      loadData();
    } catch (err) {
      addToast("Erro ao criar evento", "error");
      console.error(err);
    }
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
        <Error message={error} onRetry={loadData} />
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
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
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowWorkingHoursModal(true)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Clock className="w-5 h-5" />
                <span>Horário Atendimento</span>
              </button>
              <button
                onClick={() => setShowBlockTimeModal(true)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Ban className="w-5 h-5" />
                <span>Bloquear Horário</span>
              </button>
              <button
                onClick={() => setShowEventModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Novo Evento</span>
              </button>
            </div>
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
                      <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={nextMonth}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                </div>

                {/* Dias da Semana */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center text-sm font-semibold text-gray-600 dark:text-gray-300 py-2"
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
                    const isBlocked = isDayBlocked(day);

                    return (
                      <div key={index} className="relative group">
                        <button
                          onClick={() => day && setSelectedDate(day)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            if (day) handleBlockDay(day);
                          }}
                          className={`
                            w-full aspect-square p-2 rounded-lg transition-all relative
                            ${!day ? "invisible" : ""}
                            ${isBlocked ? "bg-red-100 border-2 border-red-300" : ""}
                            ${isToday && !isBlocked ? "bg-indigo-600 text-white font-bold" : ""}
                            ${!isToday && !isBlocked && day ? "hover:bg-gray-100 dark:hover:bg-gray-700" : ""}
                            ${selectedDate?.getDate() === day?.getDate() &&
                              selectedDate?.getMonth() === day?.getMonth() &&
                              !isToday && !isBlocked
                              ? "ring-2 ring-indigo-600"
                              : ""
                            }
                          `}
                        >
                          {day && (
                            <>
                              <span
                                className={`text-sm ${isToday ? "" : isBlocked ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-900 dark:text-gray-100"
                                  }`}
                              >
                                {day.getDate()}
                              </span>
                              {isBlocked && (
                                <Ban className="w-3 h-3 text-red-500 absolute top-1 right-1" />
                              )}
                              {hasEvents && !isBlocked && (
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
                        {day && (
                          <button
                            onClick={() => handleBlockDay(day)}
                            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white dark:bg-gray-700 rounded-full shadow-md"
                            title={isBlocked ? "Desbloquear dia" : "Bloquear dia"}
                          >
                            <Ban className={`w-3 h-3 ${isBlocked ? "text-green-500" : "text-red-500"}`} />
                          </button>
                        )}
                      </div>
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

                <div className="space-y-4 max-h-[625px] overflow-y-auto pr-2">
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

      {/* Modal de Criar Evento */}
      <Modal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          resetEventForm();
        }}
        title="Criar Novo Evento"
        size="lg"
      >
        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título do Evento *
            </label>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Ex: Reunião com Cliente"
              className="input-primary"
            />
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data *
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="input-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Horário *
              </label>
              <input
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="input-primary"
              />
            </div>
          </div>

          {/* Tipo e Duração */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as any)}
                className="input-primary"
              >
                <option value="meeting">Reunião</option>
                <option value="call">Chamada</option>
                <option value="other">Evento</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duração
              </label>
              <select
                value={eventDuration}
                onChange={(e) => setEventDuration(e.target.value)}
                className="input-primary"
              >
                <option value="30min">30 minutos</option>
                <option value="1h">1 hora</option>
                <option value="1h30">1 hora e 30 min</option>
                <option value="2h">2 horas</option>
                <option value="3h">3 horas</option>
              </select>
            </div>
          </div>

          {/* Participantes e Local */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Participantes
              </label>
              <input
                type="number"
                value={eventAttendees}
                onChange={(e) => setEventAttendees(e.target.value)}
                placeholder="Ex: 5"
                min="1"
                className="input-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Local
              </label>
              <input
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="Ex: Sala 3"
                className="input-primary"
              />
            </div>
          </div>

          {/* Link da Reunião */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              Link da Reunião
            </label>
            <input
              type="url"
              value={eventMeetingLink}
              onChange={(e) => setEventMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              className="input-primary"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Cole o link do Google Meet, Zoom, Teams, etc.
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setShowEventModal(false);
                resetEventForm();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateEvent}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Evento
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Bloquear Horário */}
      <Modal
        isOpen={showBlockTimeModal}
        onClose={() => setShowBlockTimeModal(false)}
        title="Bloquear Horário Específico"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data *
            </label>
            <input
              type="date"
              value={blockDate}
              onChange={(e) => setBlockDate(e.target.value)}
              className="input-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Início *
              </label>
              <input
                type="time"
                value={blockStartTime}
                onChange={(e) => setBlockStartTime(e.target.value)}
                className="input-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fim *
              </label>
              <input
                type="time"
                value={blockEndTime}
                onChange={(e) => setBlockEndTime(e.target.value)}
                className="input-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motivo (Opcional)
            </label>
            <input
              type="text"
              value={blockTitle}
              onChange={(e) => setBlockTitle(e.target.value)}
              placeholder="Ex: Almoço, Reunião Externa"
              className="input-primary"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowBlockTimeModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleBlockTime}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Ban className="w-4 h-4" />
              Bloquear
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Horário de Atendimento */}
      <Modal
        isOpen={showWorkingHoursModal}
        onClose={() => setShowWorkingHoursModal(false)}
        title="Configurar Horário de Atendimento (IA)"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Defina os horários em que a IA pode agendar reuniões. Você pode configurar de 1 a 4 turnos por dia.
          </p>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].map((day) => {
              const dayNames: Record<string, string> = {
                seg: 'Segunda-feira',
                ter: 'Terça-feira',
                qua: 'Quarta-feira',
                qui: 'Quinta-feira',
                sex: 'Sexta-feira',
                sab: 'Sábado',
                dom: 'Domingo'
              };

              const shifts = workingShifts[day] || [];

              return (
                <div key={day} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">{dayNames[day]}</h4>
                    <button
                      onClick={() => addShift(day)}
                      disabled={shifts.length >= 4}
                      className={`text-sm px-3 py-1 rounded ${shifts.length >= 4
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800'
                        }`}
                    >
                      + Adicionar Turno
                    </button>
                  </div>

                  {shifts.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">Nenhum turno configurado (dia fechado)</p>
                  ) : (
                    <div className="space-y-2">
                      {shifts.map((shift, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400 w-16">Turno {index + 1}</span>
                          <input
                            type="time"
                            value={shift.start}
                            onChange={(e) => updateShift(day, index, 'start', e.target.value)}
                            className="input-primary w-28"
                          />
                          <span className="text-gray-500 dark:text-gray-400">até</span>
                          <input
                            type="time"
                            value={shift.end}
                            onChange={(e) => updateShift(day, index, 'end', e.target.value)}
                            className="input-primary w-28"
                          />
                          <button
                            onClick={() => removeShift(day, index)}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Remover turno"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {shifts.length > 0 && shifts.length < 4 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Você pode adicionar até {4 - shifts.length} turno(s) adicionais
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowWorkingHoursModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpdateWorkingHours}
              className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Horários
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
