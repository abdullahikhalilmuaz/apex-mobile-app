import ConversationListScreen from "../../components/ConversationListScreen";

export default function TeacherMessages() {
  return (
    <ConversationListScreen
      title="Messages"
      subtitle="Chat with headmaster & staff"
      routePrefix="teacher"
    />
  );
}
