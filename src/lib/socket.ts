import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Single production URL for both web and native.
// If you need to test against your local server during dev,
// temporarily change this to "http://192.168.x.x:3000" and remember to
// switch back before building an APK.
export const SOCKET_URL = "https://apex-app-backend-server.onrender.com";

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket | null> {
  const token = await AsyncStorage.getItem("token");
  if (!token) return null;
  if (socket?.connected) return socket;

  console.log("[socket] connecting to", SOCKET_URL);
  socket = io(SOCKET_URL, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1500,
    reconnectionAttempts: 30,
    timeout: 20000,
  });

  socket.on("connect", () => console.log("[socket] CONNECTED id=", socket?.id));
  socket.on("disconnect", (r) => console.log("[socket] DISCONNECTED", r));
  socket.on("connect_error", (e) =>
    console.log("[socket] CONNECT ERROR", e?.message),
  );

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
