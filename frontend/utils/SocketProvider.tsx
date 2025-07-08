'use client';
import { fetchRoom } from '@/apis/room';
import { useAuth } from '@clerk/clerk-expo';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

const SocketContext = createContext<typeof Socket | null>(null);
const HOST = process.env.EXPO_PUBLIC_API_HOST!;
const PORT = process.env.EXPO_PUBLIC_API_PORT!;
const PUBLIC_URL = process.env.EXPO_PUBLIC_API_PUBLIC_URL!;

// Create a SINGLETON Socket Instance per app session
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<typeof Socket | null>(null);

  // Fetch user ID once mount

  useEffect(() => {
    const initSocket = async () => {
      if (!userId || !isSignedIn) return;
      //   const roomId = (await fetchRoom({ user_id: userId })).room_id;

      const socket = io(PUBLIC_URL || `http://${HOST}:${PORT}`, {
        transports: ['websocket'], // polling doesn't always work in React Native
        auth: { userId },
        query: { userId },
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket?.id);
        setIsConnected(true);

        // socket.emit('join-chat', roomId);
        // console.log(`Frontend: 🔗 Joined room ${roomId}`);
      });

      socket.on('disconnect', (reason: any) => {
        console.log('❌ Socket disconnected:', reason);
        setIsConnected(false);
      });
    };

    initSocket();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {isConnected && children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
