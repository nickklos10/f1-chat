"use client";

import { useChat } from "@ai-sdk/react";
import { Message as AIMessage, CreateMessage } from "ai"; // Import CreateMessage
import { Chat } from "@/components/ui/chat"; // Assuming this path is correct
import { ThemeToggle } from "@/components/ui/theme-toggle"; // Assuming this path is correct
import { Message as UIMessage } from "@/components/ui/chat-message"; // Assuming this path is correct
import { useState, useEffect, useRef, useCallback } from "react";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming this path is correct
import { Sidebar } from "@/components/ui/sidebar"; // Assuming this path is correct
import { useChatSessions } from "@/hooks/use-chat-sessions"; // Assuming this path is correct
import { nanoid } from "nanoid"; // For generating message IDs

// Simple header component
const Header = ({
  onClearChat,
  onClearSessions,
}: {
  onClearChat: () => void;
  onClearSessions: () => void;
}) => {
  const [showClearSessions, setShowClearSessions] = useState(false);

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

const PROMPT_SUGGESTIONS = [
  "Who are the drivers for Ferrari this season?",
  "Who is the greatest F1 driver of all time?",
  "Explain the DRS system in Formula 1",
  "Who is the current F1 World Drivers' Champion?",
  "Tell me about the Monaco Grand Prix",
];

export default function Home() {
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

  const [chatMessages, setChatMessages] = useState<UIMessage[]>([]);
  const isUpdatingRef = useRef(false);

  const {
    messages: aiMessages,
    input,
    handleInputChange,
    handleSubmit: originalAiHandleSubmit, // Renamed to avoid confusion
    append: originalAppend, // Renamed to avoid confusion
    isLoading,
    stop,
    setMessages: setAiMessages,
  } = useChat({
    api: "/api/chat",
    onError: (error) => {
      console.error("Chat error:", error);
    },
    id: currentSessionId,
    onFinish: (message) => {
      console.log("useChat onFinish triggered. Final assistant message:", {
        id: message.id,
        role: message.role,
        content:
          message.content.slice(0, 100) +
          (message.content.length > 100 ? "..." : ""),
      });
    },
  });

  // EFFECT 1: Sync AI messages to our UI messages and save to session
  useEffect(() => {
    console.log(
      `EFFECT 1: Triggered. isLoading: ${isLoading}, aiMessages count: ${aiMessages.length}, isUpdatingRef: ${isUpdatingRef.current}, currentSessionId: ${currentSessionId}`
    );
    console.log(
      "EFFECT 1: Current aiMessages (first 50 chars):",
      JSON.stringify(
        aiMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content.slice(0, 50) + "...",
        }))
      )
    );

    if (isUpdatingRef.current) {
      console.log("EFFECT 1: Bailing out because isUpdatingRef is true.");
      return;
    }

    if (aiMessages.length === 0 && chatMessages.length > 0) {
      console.log(
        "EFFECT 1: aiMessages is empty, chatMessages is not. Clearing chatMessages and session."
      );
      setChatMessages([]);
      if (currentSessionId && currentSession?.messages.length > 0) {
        updateSessionMessages(currentSessionId, []);
      }
      return;
    }

    if (aiMessages.length === 0 && chatMessages.length === 0) {
      console.log(
        "EFFECT 1: Both aiMessages and chatMessages are empty. Nothing to do."
      );
      return;
    }

    const uiMessages: UIMessage[] = aiMessages.map((msg) => ({
      id: msg.id,
      role: msg.role as UIMessage["role"],
      content: msg.content,
      createdAt: msg.createdAt || new Date(),
    }));

    console.log(
      "EFFECT 1: Setting chatMessages from aiMessages. New uiMessages (first 50 chars):",
      JSON.stringify(
        uiMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content.slice(0, 50) + "...",
        }))
      )
    );
    setChatMessages(uiMessages);

    if (currentSessionId) {
      console.log(
        `EFFECT 1: Updating session messages for session: ${currentSessionId}. isLoading: ${isLoading}`
      );
      // Only update session when loading is false to ensure complete messages, or use onFinish
      if (!isLoading && aiMessages.length > 0) {
        // Check aiMessages length to avoid saving empty arrays during intermediate states
        updateSessionMessages(currentSessionId, uiMessages);
      }
    }
  }, [
    aiMessages,
    currentSessionId,
    updateSessionMessages,
    isLoading,
    chatMessages.length,
    currentSession?.messages.length,
  ]);

  // EFFECT 2: Load messages from session when switching sessions or on initial load
  useEffect(() => {
    console.log(
      `EFFECT 2: Triggered. currentSessionId: ${currentSessionId}, currentSession exists: ${!!currentSession}`
    );
    if (currentSession && currentSession.messages.length > 0) {
      console.log(
        "EFFECT 2: Loading messages from currentSession. isUpdatingRef (before set):",
        isUpdatingRef.current
      );
      isUpdatingRef.current = true;
      console.log("EFFECT 2: isUpdatingRef set to true.");

      const sessionMessages = currentSession.messages.map((msg) => ({
        ...msg,
        createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      }));

      setChatMessages(sessionMessages as UIMessage[]);
      console.log(
        "EFFECT 2: chatMessages set from sessionMessages (first 50 chars):",
        JSON.stringify(
          sessionMessages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content.slice(0, 50) + "...",
          }))
        )
      );

      const aiSDKMessages = sessionMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as AIMessage["role"],
        content: msg.content,
        createdAt: msg.createdAt,
      }));

      setAiMessages(aiSDKMessages as AIMessage[]);
      console.log(
        "EFFECT 2: aiMessages set from sessionMessages (first 50 chars):",
        JSON.stringify(
          aiSDKMessages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content.slice(0, 50) + "...",
          }))
        )
      );

      setTimeout(() => {
        isUpdatingRef.current = false;
        console.log("EFFECT 2: isUpdatingRef set to false after timeout.");
      }, 0);
    } else if (
      currentSessionId &&
      (!currentSession || currentSession.messages.length === 0)
    ) {
      console.log(
        "EFFECT 2: Current session exists but has no messages, or currentSession is null. Clearing chat and AI messages."
      );
      setChatMessages([]);
      setAiMessages([]);
    }
  }, [currentSessionId, currentSession, setAiMessages]);

  const handleClearChat = useCallback(() => {
    console.log("handleClearChat called.");
    setChatMessages([]);
    setAiMessages([]);
    if (currentSessionId) {
      console.log(
        "handleClearChat: Clearing messages in session:",
        currentSessionId
      );
      updateSessionMessages(currentSessionId, []);
    }
  }, [setAiMessages, currentSessionId, updateSessionMessages]);

  const setMessagesForChatUI = useCallback(
    (newMessages: UIMessage[]) => {
      console.log(
        "setMessagesForChatUI called. isUpdatingRef (before set):",
        isUpdatingRef.current
      );
      isUpdatingRef.current = true;
      console.log("setMessagesForChatUI: isUpdatingRef set to true.");
      setChatMessages(newMessages);

      const newAiMessages = newMessages.map(
        (msg) =>
          ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.createdAt,
          } as AIMessage)
      );
      setAiMessages(newAiMessages);

      if (currentSessionId) {
        console.log(
          "setMessagesForChatUI: Updating session messages for session:",
          currentSessionId
        );
        updateSessionMessages(currentSessionId, newMessages);
      }

      setTimeout(() => {
        isUpdatingRef.current = false;
        console.log(
          "setMessagesForChatUI: isUpdatingRef set to false after timeout."
        );
      }, 0);
    },
    [setAiMessages, currentSessionId, updateSessionMessages]
  );

  // Corrected handleSubmitForm to match the expected signature by the Chat component
  const handleSubmitForm = useCallback(
    (
      event?: React.FormEvent<HTMLFormElement>, // Matches what the form's onSubmit provides
      options?: { experimental_attachments?: FileList } // Matches useChat's handleSubmit options
    ) => {
      console.log(
        "handleSubmitForm called. Input from useChat:",
        input.slice(0, 50) + "..."
      );
      if (event) {
        event.preventDefault(); // Prevent default form submission if event is provided
      }
      // Call the original handleSubmit from useChat
      // It uses the `input` state managed by `useChat` internally.
      originalAiHandleSubmit(event, options);
    },
    [originalAiHandleSubmit, input] // Add `input` to dependencies if you log it or use it directly
  );

  // Corrected handleAppend to match the expected signature by the Chat component
  const handleAppend = useCallback(
    // The Chat component will call this with a simple message object when a suggestion is clicked
    (message: { role: "user"; content: string }) => {
      console.log(
        "handleAppend called by Chat component with message content:",
        message.content.slice(0, 50) + "..."
      );

      // `originalAppend` from `useChat` expects a `CreateMessage` (or `Message`) object.
      // `CreateMessage` is typically `{ role, content, ...otherOptionalFields }`.
      // We need to add an `id` and `createdAt` if `originalAppend` requires a full `Message`
      // or if our subsequent logic relies on these fields being present immediately.
      // For `useChat`'s `append`, just `role` and `content` are usually sufficient for `CreateMessage`.
      // Let's assume `originalAppend` can take a `CreateMessage` which doesn't strictly require an id.
      // If it *must* be a full AIMessage, you'd construct it more fully:
      // const fullMessage: AIMessage = {
      //   id: nanoid(), // Generate an ID
      //   role: message.role,
      //   content: message.content,
      //   createdAt: new Date(),
      // };
      // originalAppend(fullMessage);

      originalAppend(message); // Pass the simple message object directly
    },
    [originalAppend]
  );

  return (
    <main className="flex h-screen bg-background text-foreground">
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
              handleSubmit={handleSubmitForm} // Corrected
              isGenerating={isLoading}
              stop={stop}
              setMessages={setMessagesForChatUI}
              append={handleAppend} // Corrected
              suggestions={PROMPT_SUGGESTIONS}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
