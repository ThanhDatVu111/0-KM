import * as chatModel from '../models/chatModel';

export async function createChat(input: { room_id: string; user_1: string; user_2: string }) {
  try {
    const newChat = await chatModel.createChat(input);
    return newChat;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in chatModel createChat function: ', error.message);
    } else {
      console.error('Unknown errors in chatModel createChat function: ', error);
    }
    throw error;
  }
}

export async function fetchMessages({
  room_id,
  pageParam = 0,
}: {
  room_id: string;
  pageParam?: number;
}) {
  try {
    const prevMessage = await chatModel.fetchMessages({ room_id, pageParam });
    return prevMessage;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in chatModel fetchMessage function: ', error.message);
    } else {
      console.error('Unknown errors in chatModel fetchMessage function: ', error);
    }
    throw error;
  }
}

export async function getMessageById(message_id: string) {
  try {
    const message = await chatModel.getMessageById(message_id);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in chatModel getMessageById function: ', error.message);
    } else {
      console.error('Unknown errors in chatModel getMessageById function: ', error);
    }
    throw error;
  }
}

export async function sendMessage(input: {
  message_id: string;
  room_id: string;
  content: string;
  sent_by: string;
  created_at: string;
}) {
  try {
    const newMessage = await chatModel.sendMessage(input);
    return newMessage;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in chatModel sendMessage function: ', error.message);
    } else {
      console.error('Unknown errors in chatModel sendMessage function: ', error);
    }
    throw error;
  }
}

export async function editMessage(input: { message_id: string; newInput: string }) {
  try {
    const newMessage = await chatModel.editMessage(input);
    return newMessage;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in chatModel editMessage function: ', error.message);
    } else {
      console.error('Unknown errors in chatModel editMessage function: ', error);
    }
    throw error;
  }
}

export async function deleteMessage(message_id: string) {
  try {
    await chatModel.deleteMessage(message_id);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error in chatModel sendMessage function: ', error.message);
    } else {
      console.error('Unknown errors in chatModel sendMessage function: ', error);
    }
    throw error;
  }
}
