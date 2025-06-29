import React from 'react';
import { View, Text, Pressable, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BlurView from 'expo-blur';
import images from '@/constants/images';

interface ChatBubbleProps {
    content: string;
    isSender: boolean;
    isRead: boolean;
    isEdited: boolean;
    isMedia: boolean;
    media?: string;
    isReaction: boolean;
    isSent: boolean;
    isDeleted: boolean;
    createdAt: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
    content,
    isSender,
    isRead,
    isEdited,
    isMedia,
    media,
    isReaction,
    isSent,
    createdAt,
}) => {
    // Format the timestamp
    const formattedTimestamp = new Date(createdAt).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    // Format the content
    const formattedContent = content.trim().split('\n').map((line, index) => (
    return (
}