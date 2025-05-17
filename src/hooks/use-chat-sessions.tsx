"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { nanoid } from "nanoid";
import { Message } from "@/components/ui/chat-message";

export interface ChatSession {
  id: string;
  name: string;
  createdAt: Date;
  messages: Message[];
}

interface ChatSessionsContext {
  sessions: ChatSession[];
  currentSessionId: string;
  currentSession: ChatSession | null;
  createSession: (name?: string) => string;
  renameSession: (id: string, name: string) => void;
  deleteSession: (id: string) => void;
  setCurrentSessionId: (id: string) => void;
  updateSessionMessages: (id: string, messages: Message[]) => void;
  clearAllSessions: () => void;
}

const ChatSessionsContext = createContext<ChatSessionsContext | undefined>(
  undefined
);

// Add version to localStorage to handle migrations
const STORAGE_VERSION = "1.0";

export function ChatSessionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");

  function createDefaultSession() {
    const id = nanoid();
    setSessions([
      {
        id,
        name: "New Chat",
        createdAt: new Date(),
        messages: [],
      },
    ]);
    setCurrentSessionId(id);
    return id;
  }

  // Clear all sessions data from localStorage
  function clearAllSessions() {
    localStorage.removeItem("chatSessions");
    localStorage.removeItem("chatSessionsVersion");
    createDefaultSession();
  }

  // Initialize with a default session or load from localStorage
  useEffect(() => {
    // Check storage version to handle migrations
    const storedVersion = localStorage.getItem("chatSessionsVersion");

    // If version mismatch or not set, clear data and set version
    if (storedVersion !== STORAGE_VERSION) {
      clearAllSessions();
      localStorage.setItem("chatSessionsVersion", STORAGE_VERSION);
      return;
    }

    const savedSessions = localStorage.getItem("chatSessions");

    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        // Convert date strings back to Date objects and ensure message createdAt is also Date objects
        const sessionsWithDates = parsed.map(
          (
            session: Omit<ChatSession, "createdAt" | "messages"> & {
              createdAt: string;
              messages: Array<
                Omit<Message, "createdAt"> & { createdAt?: string }
              >;
            }
          ) => ({
            ...session,
            createdAt: new Date(session.createdAt),
            messages: session.messages.map((msg) => ({
              ...msg,
              createdAt: msg.createdAt ? new Date(msg.createdAt) : undefined,
            })),
          })
        );
        setSessions(sessionsWithDates);
      } catch (e) {
        console.error("Failed to parse saved sessions", e);
        clearAllSessions();
      }
    } else {
      createDefaultSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("chatSessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  // If we don't have a current session but have sessions, set the first one as current
  useEffect(() => {
    if (!currentSessionId && sessions.length > 0) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions, currentSessionId]);

  function createSession(name?: string) {
    const id = nanoid();
    const newSession = {
      id,
      name: name || `New Chat ${sessions.length + 1}`,
      createdAt: new Date(),
      messages: [],
    };

    setSessions((prev) => [...prev, newSession]);
    setCurrentSessionId(id);
    return id;
  }

  function renameSession(id: string, name: string) {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === id ? { ...session, name } : session
      )
    );
  }

  function deleteSession(id: string) {
    setSessions((prev) => prev.filter((session) => session.id !== id));

    // If we deleted the current session, switch to another one
    if (id === currentSessionId && sessions.length > 1) {
      const remainingSessions = sessions.filter((session) => session.id !== id);
      setCurrentSessionId(remainingSessions[0].id);
    }

    // If we've deleted all sessions, create a new default one
    if (sessions.length === 1 && sessions[0].id === id) {
      createDefaultSession();
    }
  }

  function updateSessionMessages(id: string, messages: Message[]) {
    // Ensure all messages have a createdAt property as Date
    const messagesWithDates = messages.map((msg) => ({
      ...msg,
      createdAt: msg.createdAt || new Date(),
    }));

    setSessions((prev) =>
      prev.map((session) =>
        session.id === id
          ? { ...session, messages: messagesWithDates }
          : session
      )
    );
  }

  const currentSession =
    sessions.find((session) => session.id === currentSessionId) || null;

  return (
    <ChatSessionsContext.Provider
      value={{
        sessions,
        currentSessionId,
        currentSession,
        createSession,
        renameSession,
        deleteSession,
        setCurrentSessionId,
        updateSessionMessages,
        clearAllSessions,
      }}
    >
      {children}
    </ChatSessionsContext.Provider>
  );
}

export function useChatSessions() {
  const context = useContext(ChatSessionsContext);
  if (context === undefined) {
    throw new Error(
      "useChatSessions must be used within a ChatSessionsProvider"
    );
  }
  return context;
}
