import { useLocalSearchParams } from "expo-router";
import ChatScreen from "../../../components/ChatScreen";

export default function TeacherChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ChatScreen conversationId={id} />;
}