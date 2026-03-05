import { ChatWindow } from "../../components/chat/ChatWindow";

export default function ChatPage() {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <header className="space-y-1">
        <h1 className="text-lg font-semibold">Chat with NurseAda</h1>
        <p className="text-xs text-slate-400">
          Friendly, cautious health guidance. Not a replacement for your doctor.
        </p>
      </header>
      <ChatWindow />
    </div>
  );
}

