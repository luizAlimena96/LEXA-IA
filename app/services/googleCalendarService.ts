// Google Calendar Service - OAuth integration and availability checking

import { google } from 'googleapis';
import { prisma } from '@/app/lib/prisma';

// Helper to get OAuth client with dynamic redirect URI
function getOAuthClient(redirectUri?: string) {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri || process.env.GOOGLE_REDIRECT_URI
    );
}

// Generate OAuth URL for user to connect calendar
export function getAuthUrl(agentId: string, redirectUri?: string): string {
    const scopes = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
    ];

    const client = getOAuthClient(redirectUri);

    return client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: agentId, // Pass agentId to identify user after callback
    });
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string, agentId: string, redirectUri?: string) {
    const client = getOAuthClient(redirectUri);
    const { tokens } = await client.getToken(code);

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
    const client = getOAuthClient(); // Refresh doesn't need redirect URI usually, or uses default
    client.setCredentials({
        refresh_token: agent.googleRefreshToken,
    });

    const { credentials } = await client.refreshAccessToken();

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
        const client = getOAuthClient();
        client.setCredentials({
            access_token: accessToken,
        });

        const calendar = google.calendar({ version: 'v3', auth: client });

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
        const client = getOAuthClient();
        client.setCredentials({
            access_token: accessToken,
        });

        const calendar = google.calendar({ version: 'v3', auth: client });

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
        const client = getOAuthClient();
        client.setCredentials({
            access_token: accessToken,
        });

        const calendar = google.calendar({ version: 'v3', auth: client });

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

// ============================================================================
// ORGANIZATION-LEVEL FUNCTIONS
// ============================================================================

// Generate OAuth URL for organization to connect calendar
export function getAuthUrlForOrganization(organizationId: string, redirectUri?: string): string {
    const scopes = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events',
    ];

    const client = getOAuthClient(redirectUri);

    return client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: `org_${organizationId}`, // Prefix with 'org_' to identify organization
    });
}

// Exchange authorization code for tokens (Organization)
export async function exchangeCodeForTokensOrganization(code: string, organizationId: string, redirectUri?: string) {
    const client = getOAuthClient(redirectUri);
    const { tokens } = await client.getToken(code);

    await prisma.organization.update({
        where: { id: organizationId },
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

// Refresh access token if expired (Organization)
async function refreshAccessTokenOrganization(organization: any) {
    const client = getOAuthClient();
    client.setCredentials({
        refresh_token: organization.googleRefreshToken,
    });

    const { credentials } = await client.refreshAccessToken();

    await prisma.organization.update({
        where: { id: organization.id },
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

// Get valid access token (refresh if needed) - Organization
async function getValidAccessTokenOrganization(organization: any): Promise<string> {
    if (!organization.googleAccessToken) {
        throw new Error('Google Calendar not connected');
    }

    const now = new Date();
    const expiry = organization.googleTokenExpiry ? new Date(organization.googleTokenExpiry) : null;

    if (expiry && now >= expiry) {
        return await refreshAccessTokenOrganization(organization);
    }

    if (!organization.googleAccessToken) {
        throw new Error('Google Calendar not connected');
    }

    return organization.googleAccessToken;
}

// Check if time slot is available in Google Calendar (Organization)
export async function checkGoogleCalendarAvailabilityOrganization(
    organizationId: string,
    startTime: Date,
    endTime: Date
): Promise<boolean> {
    try {
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
        });

        if (!organization || !organization.googleCalendarEnabled) {
            return true; // If not connected, assume available
        }

        const accessToken = await getValidAccessTokenOrganization(organization);
        const client = getOAuthClient();
        client.setCredentials({
            access_token: accessToken,
        });

        const calendar = google.calendar({ version: 'v3', auth: client });

        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin: startTime.toISOString(),
                timeMax: endTime.toISOString(),
                items: [{ id: organization.googleCalendarId || 'primary' }],
            },
        });

        const calendars = response.data.calendars || {};
        const calendarId = organization.googleCalendarId || 'primary';
        const busy = calendars[calendarId]?.busy || [];

        return busy.length === 0; // Available if no busy periods
    } catch (error) {
        console.error('Error checking Google Calendar (Organization):', error);
        return true; // On error, assume available
    }
}

// Disconnect Google Calendar (Organization)
export async function disconnectGoogleCalendarOrganization(organizationId: string) {
    await prisma.organization.update({
        where: { id: organizationId },
        data: {
            googleCalendarEnabled: false,
            googleAccessToken: null,
            googleRefreshToken: null,
            googleCalendarId: null,
            googleTokenExpiry: null,
        },
    });
}

// ============================================================================
// CALENDAR EVENT SYNCHRONIZATION
// ============================================================================

// Sync calendar events from Google Calendar to database
export async function syncCalendarEventsOrganization(organizationId: string, daysAhead: number = 30) {
    try {
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
        });

        if (!organization || !organization.googleCalendarEnabled) {
            throw new Error('Google Calendar not connected');
        }

        const accessToken = await getValidAccessTokenOrganization(organization);
        const client = getOAuthClient();
        client.setCredentials({
            access_token: accessToken,
        });

        const calendar = google.calendar({ version: 'v3', auth: client });

        // Fetch events from now to X days ahead
        const timeMin = new Date();
        const timeMax = new Date();
        timeMax.setDate(timeMax.getDate() + daysAhead);

        const response = await calendar.events.list({
            calendarId: organization.googleCalendarId || 'primary',
            timeMin: timeMin.toISOString(),
            timeMax: timeMax.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
            maxResults: 250,
        });

        const events = response.data.items || [];

        // Sync events to database
        const syncedEvents = [];
        for (const event of events) {
            if (!event.id) continue;

            const startTime = event.start?.dateTime || event.start?.date;
            const endTime = event.end?.dateTime || event.end?.date;

            if (!startTime || !endTime) continue;

            // Upsert event (create or update)
            const syncedEvent = await prisma.calendarEvent.upsert({
                where: { googleEventId: event.id },
                create: {
                    organizationId,
                    googleEventId: event.id,
                    summary: event.summary || 'Sem título',
                    description: event.description,
                    startTime: new Date(startTime),
                    endTime: new Date(endTime),
                    isAllDay: !event.start?.dateTime, // If no time, it's all-day
                    status: event.status || 'confirmed',
                    location: event.location,
                    attendees: event.attendees ? JSON.parse(JSON.stringify(event.attendees)) : null,
                },
                update: {
                    summary: event.summary || 'Sem título',
                    description: event.description,
                    startTime: new Date(startTime),
                    endTime: new Date(endTime),
                    isAllDay: !event.start?.dateTime,
                    status: event.status || 'confirmed',
                    location: event.location,
                    attendees: event.attendees ? JSON.parse(JSON.stringify(event.attendees)) : null,
                },
            });

            syncedEvents.push(syncedEvent);
        }

        // Delete old events that are no longer in Google Calendar
        const googleEventIds = events.map(e => e.id).filter(Boolean) as string[];
        await prisma.calendarEvent.deleteMany({
            where: {
                organizationId,
                googleEventId: {
                    notIn: googleEventIds,
                },
                startTime: {
                    gte: timeMin,
                    lte: timeMax,
                },
            },
        });

        return {
            success: true,
            syncedCount: syncedEvents.length,
            events: syncedEvents,
        };
    } catch (error) {
        console.error('Error syncing calendar events:', error);
        throw error;
    }
}

// Check availability using synced calendar events
export async function checkAvailabilityWithSyncedEvents(
    organizationId: string,
    startTime: Date,
    endTime: Date
): Promise<boolean> {
    try {
        // Check if there are any conflicting events in the database
        const conflictingEvents = await prisma.calendarEvent.findMany({
            where: {
                organizationId,
                status: {
                    not: 'cancelled',
                },
                OR: [
                    {
                        // Event starts during the requested time
                        startTime: {
                            gte: startTime,
                            lt: endTime,
                        },
                    },
                    {
                        // Event ends during the requested time
                        endTime: {
                            gt: startTime,
                            lte: endTime,
                        },
                    },
                    {
                        // Event completely overlaps the requested time
                        AND: [
                            { startTime: { lte: startTime } },
                            { endTime: { gte: endTime } },
                        ],
                    },
                ],
            },
        });

        return conflictingEvents.length === 0;
    } catch (error) {
        console.error('Error checking availability with synced events:', error);
        return true; // On error, assume available
    }
}

// Create event in Google Calendar and sync to database
export async function createGoogleCalendarEventOrganization(
    organizationId: string,
    event: {
        summary: string;
        description?: string;
        start: Date;
        end: Date;
        location?: string;
        attendees?: string[];
    }
) {
    try {
        const organization = await prisma.organization.findUnique({
            where: { id: organizationId },
        });

        if (!organization || !organization.googleCalendarEnabled) {
            return null;
        }

        const accessToken = await getValidAccessTokenOrganization(organization);
        const client = getOAuthClient();
        client.setCredentials({
            access_token: accessToken,
        });

        const calendar = google.calendar({ version: 'v3', auth: client });

        const response = await calendar.events.insert({
            calendarId: organization.googleCalendarId || 'primary',
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
                attendees: event.attendees?.map(email => ({ email })),
            },
        });

        // Save to database
        if (response.data.id) {
            await prisma.calendarEvent.create({
                data: {
                    organizationId,
                    googleEventId: response.data.id,
                    summary: event.summary,
                    description: event.description,
                    startTime: event.start,
                    endTime: event.end,
                    location: event.location,
                    status: 'confirmed',
                    attendees: event.attendees ? JSON.parse(JSON.stringify(event.attendees.map(email => ({ email })))) : null,
                },
            });
        }

        return response.data;
    } catch (error) {
        console.error('Error creating Google Calendar event:', error);
        return null;
    }
}

