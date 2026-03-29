"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseSocketOptions {
  url?: string;
  room?: string;
  autoConnect?: boolean;
}

interface UseSocketReturn {
  connected: boolean;
  socket: Socket | null;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  emit: (event: string, ...args: unknown[]) => void;
  reconnect: () => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000";

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { url = WS_URL, room, autoConnect = true } = options;
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const listenersRef = useRef<Array<{ event: string; handler: (...args: unknown[]) => void }>>([]);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("partypass_token")
        : "";

    const socket = io(url, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 20,
    });

    socket.on("connect", () => {
      setConnected(true);
      if (room) {
        socket.emit("join-room", room);
      }
      // Re-register any listeners
      listenersRef.current.forEach(({ event, handler }) => {
        socket.on(event, handler);
      });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("reconnect", () => {
      setConnected(true);
      if (room) {
        socket.emit("join-room", room);
      }
    });

    socketRef.current = socket;
  }, [url, room]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [connect, autoConnect]);

  const on = useCallback(
    (event: string, handler: (...args: unknown[]) => void) => {
      listenersRef.current.push({ event, handler });
      if (socketRef.current?.connected) {
        socketRef.current.on(event, handler);
      }
    },
    []
  );

  const emit = useCallback((event: string, ...args: unknown[]) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  return {
    connected,
    socket: socketRef.current,
    on,
    emit,
    reconnect: connect,
  };
}
