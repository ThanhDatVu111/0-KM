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
    attendees?: { email: string }[];
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
