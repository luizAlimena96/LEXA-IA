// Calendar Service - Real database integration using Appointment model

export interface Event {
    id: string;
    title: string;
    date: string;
    time: string;
    type: 'meeting' | 'call' | 'reminder' | 'other';
    description?: string;
    leadId?: string;
    leadName?: string;
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
            date: new Date(apt.scheduledAt).toISOString().split('T')[0],
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
            date: new Date(apt.scheduledAt).toISOString().split('T')[0],
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
