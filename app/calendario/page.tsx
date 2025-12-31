"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Clock, Ban } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useSearchParams } from "next/navigation";

import Loading from "../components/Loading";
import Error from "../components/Error";
import { useToast, ToastContainer } from "../components/Toast";
import type { Event, BlockedSlot, AgentConfig, Organization } from "../types";
import api from "@/app/lib/api-client";

import CalendarGrid from "./components/CalendarGrid";
import EventsList from "./components/EventsList";
import CreateEventModal from "./components/CreateEventModal";
import BlockTimeModal from "./components/BlockTimeModal";
import WorkingHoursModal from "./components/WorkingHoursModal";
import EventDetailsModal from "./components/EventDetailsModal";
import CalendarHeader from "./components/CalendarHeader";
import WeeklyView from "./components/WeeklyView";
import DailyView from "./components/DailyView";
const getOrganization = (id: string) => api.organizations.get(id);
const getEvents = async (organizationId?: string): Promise<Event[]> => {
  const appointments = await api.appointments.list();

  return appointments
    .filter((apt: any) => !organizationId || apt.organizationId === organizationId)
    .map((apt: any) => ({
      id: apt.id,
      title: apt.title,
      start: apt.scheduledAt,
      end: new Date(new Date(apt.scheduledAt).getTime() + (apt.duration || 60) * 60000).toISOString(),
      date: new Date(apt.scheduledAt),
      time: new Date(apt.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      duration: `${apt.duration || 60}min`,
      type: apt.type?.toLowerCase() || 'meeting',
      color: apt.type === 'MEETING' ? 'bg-blue-500' : apt.type === 'CALL' ? 'bg-green-500' : 'bg-purple-500',
      location: apt.location,
      attendees: apt.notes,
      leadName: apt.lead?.name,
      leadPhone: apt.lead?.phone,
      meetingLink: apt.meetingLink,
      googleEventId: apt.googleEventId,
    }));
};
const createEvent = (data: any) => api.appointments.create(data);
const getBlockedSlots = (organizationId?: string) =>
  api.get(`/calendar/blocked-slots?organizationId=${organizationId}`);
const createBlockedSlot = (data: any) =>
  api.post('/calendar/blocked-slots', data);
const deleteBlockedSlot = (id: string) =>
  api.delete(`/calendar/blocked-slots/${id}`);
const getAgentConfig = (organizationId?: string) =>
  api.agents.list().then((agents: any[]) => organizationId ? agents.filter(a => a.organizationId === organizationId) : agents);
const updateAgentConfig = (agentId: string, data: any) => api.agents.update(agentId, data);

export default function CalendarPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const organizationId = searchParams.get("organizationId");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<"month" | "week" | "day">("month");

  const [showEventModal, setShowEventModal] = useState(false);
  const [showBlockTimeModal, setShowBlockTimeModal] = useState(false);
  const [showWorkingHoursModal, setShowWorkingHoursModal] = useState(false);
  const [selectedEventDetails, setSelectedEventDetails] = useState<Event | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [agentConfig, setAgentConfig] = useState<AgentConfig | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const [blockForm, setBlockForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    title: "",
  });

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
            start: evt.startTime,
            end: evt.endTime || evt.startTime,
            date: new Date(evt.startTime),
            time: new Date(evt.startTime).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: "meeting" as const,
            description: evt.description,
            location: evt.location,
            meetingLink: evt.hangoutLink || evt.conferenceData?.entryPoints?.[0]?.uri,
            color: "bg-blue-500",
          }));
        } catch (googleErr) {
          console.error("Error fetching Google Calendar events:", googleErr);
        }
      }

      const allEvents = [...eventsData, ...googleEvents]
        .filter((evt) => evt.date && evt.date >= new Date())
        .sort((a, b) => (a.date?.getTime() || 0) - (b.date?.getTime() || 0))
        .slice(0, 10);

      setEvents(allEvents);
      const parsedBlockedSlots = (blockedData as BlockedSlot[]).map(slot => ({
        ...slot,
        startTime: new Date(slot.startTime),
        endTime: new Date(slot.endTime),
      }));
      setBlockedSlots(parsedBlockedSlots);
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
    if (!organizationId) return;

    const existingSlot = blockedSlots.find(
      (slot) => {
        const slotDate = new Date(slot.startTime);
        return slot.allDay &&
          slotDate.getDate() === date.getDate() &&
          slotDate.getMonth() === date.getMonth() &&
          slotDate.getFullYear() === date.getFullYear();
      }
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

        const newSlot = await createBlockedSlot({
          organizationId,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          allDay: true,
          title: "Dia Bloqueado",
        }) as BlockedSlot;

        const parsedSlot = {
          ...newSlot,
          startTime: new Date(newSlot.startTime),
          endTime: new Date(newSlot.endTime),
        };
        setBlockedSlots([...blockedSlots, parsedSlot]);
        addToast("Dia bloqueado para agendamentos!", "success");
      }
    } catch (error) {
      addToast("Erro ao alterar bloqueio do dia", "error");
    }
  };

  const handleBlockTime = async () => {
    if (!blockForm.date || !blockForm.startTime || !blockForm.endTime || !organizationId) {
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

      const newSlot = await createBlockedSlot({
        organizationId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        allDay: false,
        title: blockForm.title || "Horário Bloqueado",
      }) as BlockedSlot;

      const parsedSlot = {
        ...newSlot,
        startTime: new Date(newSlot.startTime),
        endTime: new Date(newSlot.endTime),
      };
      setBlockedSlots([...blockedSlots, parsedSlot]);
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

      const eventDate = new Date(year, month - 1, day, hours, minutes);

      let durationMinutes = 60;
      const durationStr = eventForm.duration || "1h";
      const hourMatch = durationStr.match(/(\d+)h/);
      const minMatch = durationStr.match(/(\d+)min/);
      if (hourMatch) durationMinutes = parseInt(hourMatch[1]) * 60;
      if (minMatch) durationMinutes += parseInt(minMatch[1]);

      if (!organizationId) {
        addToast("Erro: Organização não encontrada", "error");
        return;
      }

      const appointmentData = {
        title: eventForm.title,
        scheduledAt: eventDate.toISOString(),
        duration: durationMinutes,
        type: eventForm.type.toUpperCase(),
        location: eventForm.location || undefined,
        meetingLink: eventForm.meetingLink || undefined,
        notes: eventForm.attendees ? `Participantes: ${eventForm.attendees}` : undefined,
        organizationId,
        source: "MANUAL",
      };

      await createEvent(appointmentData);
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

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await api.appointments.delete(eventId);
      addToast("Evento excluído com sucesso!", "success");
      loadData();
    } catch (error) {
      console.error("Error deleting event:", error);
      addToast("Erro ao excluir evento", "error");
    }
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
        <CalendarHeader
          currentDate={currentDate}
          view={view}
          onViewChange={setView}
          onPrev={() => {
            if (view === 'month') {
              setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
            } else if (view === 'week') {
              setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
            } else {
              setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
            }
          }}
          onNext={() => {
            if (view === 'month') {
              setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
            } else if (view === 'week') {
              setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
            } else {
              setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
            }
          }}
          onToday={() => setCurrentDate(new Date())}
          onNewEvent={() => setShowEventModal(true)}
          onBlockTime={() => setShowBlockTimeModal(true)}
          onConfigureHours={() => setShowWorkingHoursModal(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {view === 'month' ? (
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                <CalendarGrid
                  currentDate={currentDate}
                  events={events}
                  blockedSlots={blockedSlots}
                  onDateSelect={(date) => {
                    setSelectedDate(date);
                    // Optional: Switch to day view on click?
                    // setView('day'); 
                    // setCurrentDate(date);
                  }}
                  onBlockDay={handleBlockDay}
                  selectedDate={selectedDate}
                />
              </div>
            ) : view === 'week' ? (
              <WeeklyView
                currentDate={currentDate}
                events={events}
                blockedSlots={blockedSlots}
                workingShifts={workingShifts}
                onEventClick={setSelectedEventDetails}
                onSlotClick={(date, hour) => {
                  const newDate = new Date(date);
                  newDate.setHours(hour);
                  setEventForm(prev => ({ ...prev, date: newDate.toISOString().split('T')[0], time: `${hour.toString().padStart(2, '0')}:00` }));
                  setShowEventModal(true);
                }}
              />
            ) : (
              <DailyView
                currentDate={currentDate}
                events={events}
                blockedSlots={blockedSlots}
                workingShifts={workingShifts}
                onEventClick={setSelectedEventDetails}
                onSlotClick={(date, hour) => {
                  const newDate = new Date(date);
                  newDate.setHours(hour);
                  setEventForm(prev => ({ ...prev, date: newDate.toISOString().split('T')[0], time: `${hour.toString().padStart(2, '0')}:00` }));
                  setShowEventModal(true);
                }}
              />
            )}
          </div>

          <div className="lg:col-span-1 h-full min-h-[500px]">
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 h-full flex flex-col">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Agenda do Dia</h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
                <EventsList
                  events={events}
                  selectedDate={selectedDate || currentDate}
                  onClearSelection={() => setSelectedDate(null)}
                  onDeleteEvent={handleDeleteEvent}
                  onEventClick={setSelectedEventDetails}
                />
              </div>
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

      <EventDetailsModal
        isOpen={!!selectedEventDetails}
        onClose={() => setSelectedEventDetails(null)}
        event={selectedEventDetails}
        onDelete={handleDeleteEvent}
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
