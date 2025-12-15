"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, Ban } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useSearchParams } from "next/navigation";

import Loading from "../components/Loading";
import Error from "../components/Error";
import { useToast, ToastContainer } from "../components/Toast";
import type { Event, BlockedSlot } from "../services/calendarService";
import type { AgentConfig } from "../services/agentService";
import api from "@/app/lib/api-client";

import CalendarGrid from "./components/CalendarGrid";
import EventsList from "./components/EventsList";
import CreateEventModal from "./components/CreateEventModal";
import BlockTimeModal from "./components/BlockTimeModal";
import WorkingHoursModal from "./components/WorkingHoursModal";

// Wrapper functions
const getEvents = (organizationId?: string) => api.calendar.getGoogleEvents(organizationId || '');
const createEvent = (data: any) => Promise.resolve({ success: true }); // TODO: implement
const getBlockedSlots = (organizationId?: string) => Promise.resolve([]); // TODO: implement  
const createBlockedSlot = (data: any) => Promise.resolve({ success: true }); // TODO: implement
const deleteBlockedSlot = (id: string) => Promise.resolve({ success: true }); // TODO: implement
const getAgentConfig = (organizationId?: string) =>
  api.agents.list().then((agents: any[]) => organizationId ? agents.filter(a => a.organizationId === organizationId) : agents);
const updateAgentConfig = (agentId: string, data: any) => api.agents.update(agentId, data);

export default function CalendarPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("organizationId");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Modals
  const [showEventModal, setShowEventModal] = useState(false);
  const [showBlockTimeModal, setShowBlockTimeModal] = useState(false);
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);

  // Data
  const [events, setEvents] = useState<Event[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Event Form
  const [eventForm, setEventForm] = useState({
    title: "",
    date: "",
    time: "",
    duration: "1h",
    type: "meeting" as "meeting" | "call" | "other",
    attendees: "",
    location: "",
    meetingLink: "",
  });

  // Block Time Form
  const [blockForm, setBlockForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    title: "",
  });

  // Working Hours
  const [workingShifts, setWorkingShifts] = useState<Record<string, Array<{ start: string; end: string }>>>({});

  const { toasts, addToast, removeToast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [eventsData, blockedData, agentData] = await Promise.all([
        getEvents(organizationId || undefined),
        getBlockedSlots(organizationId || undefined),
        getAgentConfig(organizationId || undefined),
      ]);

      let googleEvents: Event[] = [];
      if (organizationId) {
        try {
          const googleEventsData = await api.calendar.getGoogleEvents(organizationId);
          googleEvents = googleEventsData.map((evt: any) => ({
            id: evt.id,
            title: evt.summary || "Sem título",
            date: new Date(evt.startTime),
            time: new Date(evt.startTime).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: "meeting" as const,
            description: evt.description,
            location: evt.location,
            color: "bg-blue-500",
          }));
        } catch (googleErr) {
          console.error("Error fetching Google Calendar events:", googleErr);
        }
      }

      const allEvents = [...eventsData, ...googleEvents]
        .filter((evt) => evt.date >= new Date())
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 10);

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

  const handleBlockDay = async (date: Date) => {
    if (!session?.user?.organizationId) return;

    const existingSlot = blockedSlots.find(
      (slot) =>
        slot.allDay &&
        slot.startTime.getDate() === date.getDate() &&
        slot.startTime.getMonth() === date.getMonth() &&
        slot.startTime.getFullYear() === date.getFullYear()
    );

    try {
      if (existingSlot) {
        await deleteBlockedSlot(existingSlot.id);
        setBlockedSlots(blockedSlots.filter((s) => s.id !== existingSlot.id));
        addToast("Dia desbloqueado!", "success");
      } else {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const newSlot = await createBlockedSlot(
          {
            startTime: start,
            endTime: end,
            allDay: true,
            title: "Dia Bloqueado",
          },
          session.user.organizationId
        );

        setBlockedSlots([...blockedSlots, newSlot]);
        addToast("Dia bloqueado para agendamentos!", "success");
      }
    } catch (error) {
      addToast("Erro ao alterar bloqueio do dia", "error");
    }
  };

  const handleBlockTime = async () => {
    if (!blockForm.date || !blockForm.startTime || !blockForm.endTime || !session?.user?.organizationId) {
      addToast("Preencha todos os campos", "error");
      return;
    }

    try {
      const start = new Date(`${blockForm.date}T${blockForm.startTime}`);
      const end = new Date(`${blockForm.date}T${blockForm.endTime}`);

      if (start >= end) {
        addToast("A hora de início deve ser anterior à hora de término", "error");
        return;
      }

      const newSlot = await createBlockedSlot(
        {
          startTime: start,
          endTime: end,
          allDay: false,
          title: blockForm.title || "Horário Bloqueado",
        },
        session.user.organizationId
      );

      setBlockedSlots([...blockedSlots, newSlot]);
      addToast("Horário bloqueado com sucesso!", "success");
      setShowBlockTimeModal(false);
      setBlockForm({ date: "", startTime: "", endTime: "", title: "" });
    } catch (error) {
      console.error("Error:", error);
      addToast("Erro ao bloquear horário", "error");
    }
  };

  const handleUpdateWorkingHours = async () => {
    if (!agentConfig) {
      addToast("Erro: Agente não encontrado", "error");
      return;
    }

    try {
      await updateAgentConfig(agentConfig.id, { workingHours: workingShifts });
      setAgentConfig({ ...agentConfig, workingHours: workingShifts });
      addToast("Horários de atendimento atualizados!", "success");
      setShowWorkingHoursModal(false);
    } catch (error) {
      console.error("Error updating working hours:", error);
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
      [day]: [...currentShifts, { start: "08:00", end: "12:00" }],
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

  const updateShift = (day: string, index: number, field: "start" | "end", value: string) => {
    const currentShifts = workingShifts[day] || [];
    const newShifts = [...currentShifts];
    newShifts[index] = { ...newShifts[index], [field]: value };
    setWorkingShifts({ ...workingShifts, [day]: newShifts });
  };

  const handleCreateEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.date || !eventForm.time) {
      addToast("Por favor, preencha os campos obrigatórios", "error");
      return;
    }

    try {
      const [year, month, day] = eventForm.date.split("-").map(Number);
      const [hours, minutes] = eventForm.time.split(":").map(Number);

      const newEvent: Omit<Event, "id"> = {
        title: eventForm.title,
        date: new Date(year, month - 1, day, hours, minutes),
        time: eventForm.time,
        duration: eventForm.duration,
        type: eventForm.type,
        attendees: eventForm.attendees ? parseInt(eventForm.attendees) : undefined,
        location: eventForm.location || undefined,
        color:
          eventForm.type === "meeting"
            ? "bg-blue-500"
            : eventForm.type === "call"
              ? "bg-green-500"
              : "bg-purple-500",
      };

      if (!session?.user?.organizationId) {
        addToast("Erro: Organização não encontrada", "error");
        return;
      }

      await createEvent(newEvent, session.user.organizationId);
      addToast("Evento criado com sucesso!", "success");
      setShowEventModal(false);
      setEventForm({
        title: "",
        date: "",
        time: "",
        duration: "1h",
        type: "meeting",
        attendees: "",
        location: "",
        meetingLink: "",
      });
      loadData();
    } catch (err) {
      addToast("Erro ao criar evento", "error");
      console.error(err);
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
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
        <Error message={error} onRetry={loadData} />
      </div>
    );
  }

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

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendário</h1>
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
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
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

                <CalendarGrid
                  currentDate={currentDate}
                  events={events}
                  blockedSlots={blockedSlots}
                  onDateSelect={setSelectedDate}
                  onBlockDay={handleBlockDay}
                  selectedDate={selectedDate}
                />
              </div>
            </div>

            <div className="lg:col-span-1">
              <EventsList
                events={events}
                selectedDate={selectedDate}
                onClearSelection={() => setSelectedDate(null)}
              />
            </div>
          </div>
        </div>
      </div>

      <CreateEventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSave={handleCreateEvent}
        formData={eventForm}
        setFormData={setEventForm}
      />

      <BlockTimeModal
        isOpen={showBlockTimeModal}
        onClose={() => setShowBlockTimeModal(false)}
        onSave={handleBlockTime}
        formData={blockForm}
        setFormData={setBlockForm}
      />

      <WorkingHoursModal
        isOpen={showWorkingHoursModal}
        onClose={() => setShowWorkingHoursModal(false)}
        onSave={handleUpdateWorkingHours}
        workingShifts={workingShifts}
        onAddShift={addShift}
        onRemoveShift={removeShift}
        onUpdateShift={updateShift}
      />
    </>
  );
}
