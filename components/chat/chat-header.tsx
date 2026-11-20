"use client";

import { cn } from "@/lib/utils";
import { Loader2, Menu, PanelLeftClose } from "lucide-react";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

interface ChatHeaderProps {
  connectionStatus: ConnectionStatus;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function ChatHeader({
  connectionStatus,
  sidebarOpen,
  onToggleSidebar,
}: ChatHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold text-foreground">SuperAgent</h1>
        <span
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
            connectionStatus === "connected" &&
              "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
            connectionStatus === "connecting" &&
              "bg-amber-500/10 text-amber-700 dark:text-amber-400",
            connectionStatus === "disconnected" &&
              "bg-muted text-muted-foreground",
          )}
        >
          {connectionStatus === "connecting" && (
            <Loader2 className="h-3 w-3 animate-spin" />
          )}
          {connectionStatus === "connected" && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          )}
          {connectionStatus === "disconnected" && (
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          )}
          {connectionStatus === "connected" && "Connected"}
          {connectionStatus === "connecting" && "Connecting..."}
          {connectionStatus === "disconnected" && "Disconnected"}
        </span>
      </div>
    </header>
  );
}
