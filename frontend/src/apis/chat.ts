import React from 'react';
import {
  Message,
  FetchMessages,
  GetMessageById,
  SendMessage,
  EditMessage,
  DeleteMessage,
  FetchMessagesResponse,
} from '@/types/chat';
import { BASE_URL } from './apiClient';
import { useInfiniteQuery } from '@tanstack/react-query';

const host = process.env.EXPO_PUBLIC_API_HOST;
const port = process.env.EXPO_PUBLIC_API_PORT;

if (!host || !port) {
  throw new Error('Missing LOCAL_HOST_URL or PORT in your environment');
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchMessages({
  room_id,
  pageParam = 0,
}: {
  room_id: string;
  pageParam?: number;
}): Promise<Message[]> {
  try {
    const response = await fetch(`${BASE_URL}/chat?room_id=${room_id}&pageParam=${pageParam}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error);
    }
    await delay(800);
    return result.data;
  } catch (error: any) {
    console.error('Error fetching chat:', error);
    throw error;
  }
}

export async function getMessageById(message_id: string): Promise<Message> {
  try {
    const response = await fetch(`${BASE_URL}/chat/${message_id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error);
    }

    return result.data;
  } catch (error: any) {
    console.error('Error fetching message:', {
      error,
      message: error.message,
      message_id,
    });
    throw error;
  }
}

export async function sendMessage(message: SendMessage): Promise<Message> {
  try {
    console.log('Sending message:', message);
    const response = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send message');
    }

    return result.data;
  } catch (error: any) {
    console.error('Error sending message:', {
      error,
      message: error.message,
      payload: message,
    });
    throw error;
  }
}

export async function editMessage(attrs: {
  message_id: string;
  content: string;
}): Promise<Message> {
  try {
    const response = await fetch(`${BASE_URL}/chat/${attrs.message_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newInput: attrs.content }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error);
    }

    return result.data;
  } catch (error: any) {
    console.error('Error editing message:', {
      error,
      message: error.message,
    });
    throw error;
  }
}

export async function deleteMessage(message_id: string): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/chat/${message_id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error);
    }
  } catch (error: any) {
    console.error('Error deleting message:', {
      error,
      message: error.message,
      message_id,
    });
    throw error;
  }
}
