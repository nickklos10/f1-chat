"use client";

import { useChat } from "ai/react";
import { Message as AIMessage } from "ai";
import { Chat } from "@/components/ui/chat";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Message as UIMessage } from "@/components/ui/chat-message";
import { useState, useEffect, useRef, useCallback } from "react";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/ui/sidebar";
import { useChatSessions } from "@/hooks/use-chat-sessions";

// Simple header component
const Header = ({
  onClearChat,
  onClearSessions,
}: {
  onClearChat: () => void;
  onClearSessions: () => void;
}) => {
  const [showClearSessions, setShowClearSessions] = useState(false);

  // Secret key combination to show clear sessions button (CTRL+ALT+C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === "c") {
        setShowClearSessions(!showClearSessions);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showClearSessions]);

  return (
    <header className="border-b p-4 flex justify-between items-center bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10">
          <img
            src="/f1-gpt.png"
            className="h-full w-full object-contain"
            alt="F1GPT Logo"
          />
        </div>
        <h1 className="text-xl font-semibold">F1GPT</h1>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Button
          variant="outline"
          size="sm"
          onClick={onClearChat}
          className="flex items-center gap-1"
        >
          <Trash className="h-4 w-4" />
          <span>Clear Chat</span>
        </Button>
        {showClearSessions && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onClearSessions}
            className="flex items-center gap-1"
          >
            <Trash className="h-4 w-4" />
            <span>Reset All Data</span>
          </Button>
        )}
      </div>
    </header>
  );
};

// F1 related prompt suggestions
const PROMPT_SUGGESTIONS = [
  "Tell me about the current F1 championship standings",
  "Who is the greatest F1 driver of all time?",
  "Explain the DRS system in Formula 1",
  "What are the major rule changes in F1 this season?",
  "Tell me about the Monaco Grand Prix",
];

export default function Home() {
  // Use our chat sessions hook
  const {
    sessions,
    currentSessionId,
    currentSession,
    createSession,
    renameSession,
    deleteSession,
    setCurrentSessionId,
    updateSessionMessages,
    clearAllSessions,
  } = useChatSessions();

  // Use our own state for the chat UI component
  const [chatMessages, setChatMessages] = useState<UIMessage[]>([]);
  const isUpdatingRef = useRef(false);

  const {
    messages: aiMessages,
    input,
    handleInputChange,
    handleSubmit: aiHandleSubmit,
    append,
    isLoading,
    stop,
    setMessages: setAiMessages,
  } = useChat({
    api: "/api/chat",
    onError: (error) => {
      console.error("Chat error:", error);
    },
    id: currentSessionId,
  });

  // Sync AI messages to our UI messages
  useEffect(() => {
    if (isUpdatingRef.current) return;

    if (aiMessages.length === 0) {
      setChatMessages([]);
      return;
    }

    // Convert AI SDK messages to UI messages
    const uiMessages: UIMessage[] = aiMessages.map((msg) => ({
      id: msg.id,
      role: msg.role as UIMessage["role"],
      content: msg.content,
      createdAt: new Date(),
    }));

    setChatMessages(uiMessages);

    // Update our chat session with the new messages
    if (currentSessionId) {
      updateSessionMessages(currentSessionId, uiMessages);
    }
  }, [aiMessages, currentSessionId, updateSessionMessages]);

  // Load messages from session when switching sessions
  useEffect(() => {
    if (currentSession && currentSession.messages.length > 0) {
      isUpdatingRef.current = true;

      const sessionMessages = currentSession.messages;
      setChatMessages(sessionMessages);

      // Convert UI messages back to AI SDK format
      const aiSDKMessages = sessionMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as AIMessage["role"],
        content: msg.content,
      }));

      setAiMessages(aiSDKMessages as AIMessage[]);

      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    } else {
      setChatMessages([]);
      setAiMessages([]);
    }
  }, [currentSessionId, currentSession, setAiMessages]);

  const handleClearChat = useCallback(() => {
    setChatMessages([]);
    setAiMessages([]);

    // Also update the current session to have empty messages
    if (currentSessionId) {
      updateSessionMessages(currentSessionId, []);
    }
  }, [setAiMessages, currentSessionId, updateSessionMessages]);

  // Custom setMessages function that doesn't cause a loop
  const setMessages = useCallback(
    (messages: UIMessage[]) => {
      isUpdatingRef.current = true;
      setChatMessages(messages);

      // Convert UI messages back to AI SDK format without triggering the effect
      const aiMessages = messages.map((msg) => ({
        id: msg.id,
        role: msg.role as AIMessage["role"],
        content: msg.content,
      }));

      setAiMessages(aiMessages as AIMessage[]);

      // Update our chat session with the new messages
      if (currentSessionId) {
        updateSessionMessages(currentSessionId, messages);
      }

      // Reset the flag after the update
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    },
    [setAiMessages, currentSessionId, updateSessionMessages]
  );

  // Wrap the AI SDK's handleSubmit to work with our UI
  const handleSubmit = useCallback(
    (
      event?: React.FormEvent,
      options?: { experimental_attachments?: FileList }
    ) => {
      return aiHandleSubmit(event, options);
    },
    [aiHandleSubmit]
  );

  return (
    <main className="flex h-screen">
      <Sidebar
        sessions={sessions}
        currentSession={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onCreateSession={createSession}
        onRenameSession={renameSession}
        onDeleteSession={deleteSession}
      />
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <Header
          onClearChat={handleClearChat}
          onClearSessions={clearAllSessions}
        />
        <div className="flex-1 overflow-hidden">
          <div className="mx-auto max-w-3xl h-full">
            <Chat
              className="h-full"
              messages={chatMessages}
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isGenerating={isLoading}
              stop={stop}
              setMessages={setMessages}
              append={append}
              suggestions={PROMPT_SUGGESTIONS}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
