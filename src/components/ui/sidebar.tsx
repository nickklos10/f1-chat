"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ChatSession {
  id: string;
  name: string;
  createdAt: Date;
}

interface SidebarProps {
  sessions: ChatSession[];
  currentSession: string;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: (name: string) => void;
  onRenameSession: (sessionId: string, name: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

export function Sidebar({
  sessions,
  currentSession,
  onSelectSession,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState("");
  const [renameText, setRenameText] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSession = () => {
    if (!newSessionName.trim()) {
      setNewSessionName(`New Chat ${sessions.length + 1}`);
      onCreateSession(`New Chat ${sessions.length + 1}`);
    } else {
      onCreateSession(newSessionName);
    }
    setIsCreating(false);
    setNewSessionName("");
  };

  const handleRenameSession = () => {
    if (isRenaming && renameText.trim()) {
      onRenameSession(isRenaming, renameText);
    }
    setIsRenaming(null);
    setRenameText("");
  };

  const startRename = (session: ChatSession) => {
    setIsRenaming(session.id);
    setRenameText(session.name);
  };

  return (
    <div
      className={cn(
        "h-screen border-r flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 border-b flex items-center justify-between">
        {!isCollapsed && <h2 className="font-semibold">Chats</h2>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="p-2">
        <Button
          variant="outline"
          size={isCollapsed ? "icon" : "default"}
          onClick={() => setIsCreating(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          {!isCollapsed && <span>New Chat</span>}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer",
                currentSession === session.id && "bg-accent"
              )}
            >
              <div
                className="flex items-center gap-2 flex-1 min-w-0"
                onClick={() => onSelectSession(session.id)}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="truncate">{session.name}</span>
                )}
              </div>

              {!isCollapsed && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startRename(session)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDeleteSession(session.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Create New Session Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Chat</DialogTitle>
            <DialogDescription>
              Enter a name for your new chat session.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder="New Chat"
            className="my-4"
            style={{
              backgroundColor: "var(--input)",
              color: "var(--foreground)",
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSession}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Session Dialog */}
      <Dialog
        open={!!isRenaming}
        onOpenChange={(open) => !open && setIsRenaming(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription>
              Enter a new name for your chat session.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameText}
            onChange={(e) => setRenameText(e.target.value)}
            placeholder="Chat name"
            className="my-4"
            style={{
              backgroundColor: "var(--input)",
              color: "var(--foreground)",
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenaming(null)}>
              Cancel
            </Button>
            <Button onClick={handleRenameSession}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
