import { BASE_URL } from './apiClient';

export interface FetchCalendarEventsRequest {
  partnerAccessToken: string;
}

export async function fetchCalendarEvents(request: FetchCalendarEventsRequest): Promise<any[]> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${request.partnerAccessToken}`,
        },
      },
    );
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch partner events');
    }

    return result.items;
  } catch (error) {
    console.error('Error fetching calendar events');
    return [];
  }
}

export interface CreateCalendarEventRequest {
  accessToken: string;
  event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    attendees: {
      email: string;
    }[];

    conferenceData?: any;
  };
  sendUpdates?: 'all' | 'externalOnly' | 'none' | 'email';
}

export async function createCalendarEvent({
  accessToken,
  event,
  sendUpdates = 'email',
}: CreateCalendarEventRequest): Promise<any> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=${sendUpdates}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      },
    );
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error?.message || 'Failed to create event');
    }
    return result;
  } catch (error) {
    console.error('Error creating calendar event', error);
    throw error;
  }
}

export interface CreateEventRequest {
  id?: string;
  room_id: string;
  user_1: string;
  user_2: string;
  start_time: string;
  start_timezone: string;
  end_time: string;
  end_timezone: string;
  title: string;
}
//post the created event to supabase for display in widget
export async function createEvent(request: CreateEventRequest): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/calendar`, {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!response) {
      throw new Error('error creating event to supabase');
    }
    const result = response.json();
    return result;
  } catch (error) {
    console.error('error when creating event to supabase:', error);
  }
}
