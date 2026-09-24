import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ⚠️ CHANGE THIS to your laptop's LAN IP when testing locally
// Find your IP: run `ipconfig` on Windows, look for IPv4 Address
// When you deploy app-server, swap to the production URL
export const APP_SERVER_URL =
  "https://apex-app-backend-server.onrender.com/api/app";

const appApi = axios.create({
  baseURL: APP_SERVER_URL,
  timeout: 20000,
});

appApi.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

appApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      console.error("App-Server network error:", error.message);
    }
    return Promise.reject(error);
  },
);

export default appApi;
