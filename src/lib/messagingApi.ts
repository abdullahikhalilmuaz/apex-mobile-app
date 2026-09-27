import appApi from "./appApi";

export const messagingApi = {
  syncMe: (name?: string, email?: string) =>
    appApi.post("/messaging/sync-me", { name, email }),

  getRecipients: () => appApi.get("/messaging/recipients"),

  getConversations: () => appApi.get("/messaging/conversations"),

  getMessages: (id: string) => appApi.get(`/messaging/conversations/${id}`),

  startDirect: (toUserId: string) =>
    appApi.post("/messaging/start-direct", { toUserId }),

  send: (conversationId: string, content: string) =>
    appApi.post("/messaging/send", { conversationId, content }),

  openTeachersGroup: () => appApi.post("/messaging/teachers-group"),
};