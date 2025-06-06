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
