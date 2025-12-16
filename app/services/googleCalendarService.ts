import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

/**
 * Generate Google OAuth URL for user authentication
 */
export function getAuthUrl(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/google/callback';

    if (!clientId || !clientSecret) {
        throw new Error('Google Calendar credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local');
    }

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
    });
}

/**
 * Generate Google OAuth URL for organization
 */
export function getAuthUrlForOrganization(organizationId: string): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/google/callback';

    if (!clientId || !clientSecret) {
        throw new Error('Google Calendar credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local');
    }

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
        state: organizationId, // Pass organizationId in state
    });
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/google/callback'
    );

    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

/**
 * Create OAuth2 client with refresh token
 */
export function createOAuth2Client(refreshToken: string) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
        refresh_token: refreshToken,
    });

    return oauth2Client;
}

/**
 * List calendar events
 */
export async function listEvents(refreshToken: string, timeMin?: Date, timeMax?: Date) {
    const oauth2Client = createOAuth2Client(refreshToken);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin?.toISOString() || new Date().toISOString(),
        timeMax: timeMax?.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
    });

    return response.data.items || [];
}

/**
 * Create calendar event
 */
export async function createEvent(
    refreshToken: string,
    event: {
        summary: string;
        description?: string;
        start: { dateTime: string; timeZone?: string };
        end: { dateTime: string; timeZone?: string };
        attendees?: { email: string }[];
    }
) {
    const oauth2Client = createOAuth2Client(refreshToken);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
    });

    return response.data;
}

/**
 * Check if time slot is available
 */
export async function isTimeSlotAvailable(
    refreshToken: string,
    startTime: Date,
    endTime: Date
): Promise<boolean> {
    const events = await listEvents(refreshToken, startTime, endTime);
    return events.length === 0;
}
