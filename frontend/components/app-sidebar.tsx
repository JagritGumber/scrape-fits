import * as React from "react";
import { Menu, PencilLine, Settings } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type Session = {
  id: number;
  created_at: string;
  query: string;
};

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";

async function fetchSessions(): Promise<Session[]> {
  const response = await fetch(`${BACKEND_URL}/sessions`);
  if (!response.ok) {
    throw new Error("Failed to load sessions");
  }
  return response.json();
}

async function createSession(): Promise<Session> {
  const response = await fetch(`${BACKEND_URL}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: "",
      issues: [],
      max_results: 0,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create session");
  }

  return response.json();
}

export function AppSidebar() {
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchSessions();
        if (active) {
          setSessions(data);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setError("Could not load sessions");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  async function handleNewSession() {
    try {
      setCreating(true);
      setError(null);
      const next = await createSession();
      setSessions((current) => [next, ...current]);
    } catch (err) {
      console.error(err);
      setError("Could not create session");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarTrigger>
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
        <button
          type="button"
          disabled={creating}
          onClick={() => {
            void handleNewSession();
          }}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground",
            "hover:bg-sidebar-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          )}
        >
          <PencilLine className="h-5 w-5" />
        </button>
      </SidebarHeader>
      <SidebarContent>
        {loading && (
          <div className="px-2 text-xs text-muted-foreground">
            Loading sessions…
          </div>
        )}
        {error && (
          <div className="px-2 text-xs text-destructive">{error}</div>
        )}
        {!loading && !error && sessions.length === 0 && (
          <div className="px-2 text-xs text-muted-foreground">
            No sessions yet.
          </div>
        )}
        <ul className="space-y-1">
          {sessions.map((session) => (
            <li key={session.id}>
              <button
                type="button"
                className={cn(
                  "flex w-full items-center rounded-md px-2 py-1.5 text-left text-xs",
                  "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <span className="line-clamp-2">
                  {session.query || "Untitled session"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </SidebarContent>
      <SidebarFooter>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <Settings className="h-4 w-4" />
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}

