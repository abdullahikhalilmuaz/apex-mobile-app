import { useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { connectSocket, disconnectSocket } from "../lib/socket";
import { useAuth } from "./useAuth";

export function useSocket() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      setSocket(null);
      setConnected(false);
      return;
    }

    let mounted = true;
    connectSocket().then((s) => {
      if (!mounted || !s) return;
      setSocket(s);
      setConnected(s.connected);
      s.on("connect", () => setConnected(true));
      s.on("disconnect", () => setConnected(false));
    });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return { socket, connected };
}
