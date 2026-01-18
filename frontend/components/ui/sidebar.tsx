import * as React from "react";

import { cn } from "@/lib/utils";

type SidebarContextValue = {
  open: boolean;
  toggle: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
  undefined,
);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("Sidebar components must be used within <SidebarProvider>");
  }
  return context;
}

type SidebarProviderProps = {
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function SidebarProvider({
  children,
  defaultOpen = false,
}: SidebarProviderProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  const toggle = React.useCallback(() => {
    setOpen((value) => !value);
  }, []);

  return (
    <SidebarContext.Provider value={{ open, toggle }}>
      <div
        data-sidebar-open={open ? "true" : "false"}
        className="flex min-h-screen w-full bg-background text-foreground"
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

type SidebarProps = React.HTMLAttributes<HTMLElement>;

export function Sidebar({ className, ...props }: SidebarProps) {
  const { open } = useSidebar();

  return (
    <aside
      data-state={open ? "open" : "collapsed"}
      className={cn(
        "flex flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-linear",
        open ? "w-72" : "w-16",
        className,
      )}
      {...props}
    />
  );
}

type SidebarHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export function SidebarHeader({ className, ...props }: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 border-b border-sidebar-border px-3 py-4",
        className,
      )}
      {...props}
    />
  );
}

type SidebarContentProps = React.HTMLAttributes<HTMLDivElement>;

export function SidebarContent({ className, ...props }: SidebarContentProps) {
  const { open } = useSidebar();

  return (
    <div
      className={cn(
        "flex-1 space-y-2 overflow-y-auto px-2 py-3",
        !open && "hidden",
        className,
      )}
      {...props}
    />
  );
}

type SidebarFooterProps = React.HTMLAttributes<HTMLDivElement>;

export function SidebarFooter({ className, ...props }: SidebarFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center border-t border-sidebar-border px-3 py-3",
        className,
      )}
      {...props}
    />
  );
}

type SidebarTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function SidebarTrigger({
  className,
  children,
  onClick,
  ...props
}: SidebarTriggerProps) {
  const { toggle } = useSidebar();

  return (
    <button
      type="button"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          toggle();
        }
      }}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

