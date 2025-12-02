// Calendar Service - Real database integration using Appointment model

export interface Event {
    id: string;
    title: string;
    date: Date;
    time: string;
    type: 'meeting' | 'call' | 'reminder' | 'other';
    description?: string;
    leadId?: string;
    leadName?: string;
    duration?: string;
    attendees?: number;
    location?: string;
    color?: string;
}

export async function getEvents(organizationId?: string): Promise<Event[]> {
    try {
        const url = organizationId
            ? `/api/appointments?organizationId=${organizationId}`
            : '/api/appointments';

        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch events');

        const appointments = await response.json();
        return appointments.map((apt: any) => ({
            id: apt.id,
            title: apt.title,
            date: new Date(apt.scheduledAt),
            time: new Date(apt.scheduledAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            type: apt.type || 'other',
            description: apt.notes,
            leadId: apt.leadId,
            leadName: apt.lead?.name,
        }));
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
}

export async function createEvent(event: Partial<Event>, organizationId: string): Promise<Event> {
    try {
        const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                title: event.title,
                scheduledAt: new Date(`${event.date}T${event.time}`),
                type: event.type,
                notes: event.description,
                leadId: event.leadId,
                organizationId,
            }),
        });

        if (!response.ok) throw new Error('Failed to create event');
        const apt = await response.json();

        return {
            id: apt.id,
            title: apt.title,
            date: new Date(apt.scheduledAt),
            time: new Date(apt.scheduledAt).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            type: apt.type,
            description: apt.notes,
            leadId: apt.leadId,
        };
    } catch (error) {
        console.error('Error creating event:', error);
        throw error;
    }
}

export async function updateEvent(id: string, event: Partial<Event>): Promise<Event> {
    try {
        const response = await fetch(`/api/appointments?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                title: event.title,
                scheduledAt: event.date && event.time
                    ? new Date(`${event.date}T${event.time}`)
                    : undefined,
                type: event.type,
                notes: event.description,
            }),
        });

        if (!response.ok) throw new Error('Failed to update event');
        return await response.json();
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
}

export async function deleteEvent(id: string): Promise<void> {
    try {
        const response = await fetch(`/api/appointments?id=${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to delete event');
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
}

// Blocked Slots
export interface BlockedSlot {
    id: string;
    startTime: Date;
    endTime: Date;
    title?: string;
    allDay: boolean;
}

export async function getBlockedSlots(organizationId?: string): Promise<BlockedSlot[]> {
    try {
        const url = organizationId
            ? `/api/calendar/blocked?organizationId=${organizationId}`
            : '/api/calendar/blocked';

        const response = await fetch(url, { credentials: 'include' });
        if (!response.ok) throw new Error('Failed to fetch blocked slots');

        const slots = await response.json();
        return slots.map((slot: any) => ({
            id: slot.id,
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime),
            title: slot.title,
            allDay: slot.allDay,
        }));
    } catch (error) {
        console.error('Error fetching blocked slots:', error);
        return [];
    }
}

export async function createBlockedSlot(slot: Partial<BlockedSlot>, organizationId: string): Promise<BlockedSlot> {
    try {
        const response = await fetch('/api/calendar/blocked', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                startTime: slot.startTime,
                endTime: slot.endTime,
                title: slot.title,
                allDay: slot.allDay,
                organizationId,
            }),
        });

        if (!response.ok) throw new Error('Failed to create blocked slot');
        const newSlot = await response.json();

        return {
            id: newSlot.id,
            startTime: new Date(newSlot.startTime),
            endTime: new Date(newSlot.endTime),
            title: newSlot.title,
            allDay: newSlot.allDay,
        };
    } catch (error) {
        console.error('Error creating blocked slot:', error);
        throw error;
    }
}

export async function deleteBlockedSlot(id: string): Promise<void> {
    try {
        const response = await fetch(`/api/calendar/blocked/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });

        if (!response.ok) throw new Error('Failed to delete blocked slot');
    } catch (error) {
        console.error('Error deleting blocked slot:', error);
        throw error;
    }
}
