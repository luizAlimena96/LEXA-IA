// Google Calendar Service - OAuth integration and availability checking

import { google } from 'googleapis';
import { prisma } from '@/app/lib/prisma';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Generate OAuth URL for user to connect calendar
export function getAuthUrl(agentId: string): string {
    const scopes = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: agentId, // Pass agentId to identify user after callback
    });
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string, agentId: string) {
    const { tokens } = await oauth2Client.getToken(code);

    await prisma.agent.update({
        where: { id: agentId },
        data: {
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token,
            googleTokenExpiry: tokens.expiry_date
                ? new Date(tokens.expiry_date)
                : null,
            googleCalendarEnabled: true,
        },
    });

    return tokens;
}

// Refresh access token if expired
async function refreshAccessToken(agent: any) {
    oauth2Client.setCredentials({
        refresh_token: agent.googleRefreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    await prisma.agent.update({
        where: { id: agent.id },
        data: {
            googleAccessToken: credentials.access_token,
            googleTokenExpiry: credentials.expiry_date
                ? new Date(credentials.expiry_date)
                : null,
        },
    });

    if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
    }

    return credentials.access_token;
}

// Get valid access token (refresh if needed)
async function getValidAccessToken(agent: any): Promise<string> {
    if (!agent.googleAccessToken) {
        throw new Error('Google Calendar not connected');
    }

    const now = new Date();
    const expiry = agent.googleTokenExpiry ? new Date(agent.googleTokenExpiry) : null;

    if (expiry && now >= expiry) {
        return await refreshAccessToken(agent);
    }

    if (!agent.googleAccessToken) {
        throw new Error('Google Calendar not connected');
    }

    return agent.googleAccessToken;
}

// Check if time slot is available in Google Calendar
export async function checkGoogleCalendarAvailability(
    agentId: string,
    startTime: Date,
    endTime: Date
): Promise<boolean> {
    try {
        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
        });

        if (!agent || !agent.googleCalendarEnabled) {
            return true; // If not connected, assume available
        }

        const accessToken = await getValidAccessToken(agent);

        oauth2Client.setCredentials({
            access_token: accessToken,
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: startTime.toISOString(),
                timeMax: endTime.toISOString(),
                items: [{ id: agent.googleCalendarId || 'primary' }],
            },
        });

        const calendars = response.data.calendars || {};
        const calendarId = agent.googleCalendarId || 'primary';
        const busy = calendars[calendarId]?.busy || [];

        return busy.length === 0; // Available if no busy periods
    } catch (error) {
        console.error('Error checking Google Calendar:', error);
        return true; // On error, assume available
    }
}

// Create event in Google Calendar
export async function createGoogleCalendarEvent(
    agentId: string,
    event: {
        summary: string;
        description?: string;
        start: Date;
        end: Date;
        location?: string;
    }
) {
    try {
        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
        });

        if (!agent || !agent.googleCalendarEnabled) {
            return null;
        }

        const accessToken = await getValidAccessToken(agent);

        oauth2Client.setCredentials({
            access_token: accessToken,
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const response = await calendar.events.insert({
            calendarId: agent.googleCalendarId || 'primary',
            requestBody: {
                summary: event.summary,
                description: event.description,
                location: event.location,
                start: {
                    dateTime: event.start.toISOString(),
                    timeZone: 'America/Sao_Paulo',
                },
                end: {
                    dateTime: event.end.toISOString(),
                    timeZone: 'America/Sao_Paulo',
                },
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        return null;
    }
}

// Update existing event in Google Calendar
export async function updateGoogleCalendarEvent(
    agentId: string,
    eventId: string,
    updates: {
        summary?: string;
        description?: string;
        start?: Date;
        end?: Date;
        location?: string;
    }
) {
    try {
        const agent = await prisma.agent.findUnique({
            where: { id: agentId },
        });

        if (!agent || !agent.googleCalendarEnabled) {
            return null;
        }

        const accessToken = await getValidAccessToken(agent);

        oauth2Client.setCredentials({
            access_token: accessToken,
        });

        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        const response = await calendar.events.update({
            calendarId: agent.googleCalendarId || 'primary',
            eventId,
            requestBody: {
                summary: updates.summary,
                description: updates.description,
                location: updates.location,
                start: updates.start
                    ? {
                        dateTime: updates.start.toISOString(),
                        timeZone: 'America/Sao_Paulo',
                    }
                    : undefined,
                end: updates.end
                    ? {
                        dateTime: updates.end.toISOString(),
                        timeZone: 'America/Sao_Paulo',
                    }
                    : undefined,
            },
        });

        return response.data;
    } catch (error) {
        console.error('Error updating Google Calendar event:', error);
        return null;
    }
}

// Disconnect Google Calendar
export async function disconnectGoogleCalendar(agentId: string) {
    await prisma.agent.update({
        where: { id: agentId },
        data: {
            googleCalendarEnabled: false,
            googleAccessToken: null,
            googleRefreshToken: null,
            googleCalendarId: null,
            googleTokenExpiry: null,
        },
    });
}
