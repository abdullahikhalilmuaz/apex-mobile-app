import ConversationListScreen from "../../components/ConversationListScreen";

export default function ParentMessages() {
  return (
    <ConversationListScreen
      title="Messages"
      subtitle="Chat with the headmaster"
      routePrefix="parent"
    />
  );
}
