import { ChevronLeftIcon, ChevronRightIcon, InfoIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

import { ContributorField } from "./contributor-field";
import type { ContributorFieldHandle, FieldMode } from "./contributor-field";

interface NotFoundHeroProps {
  logins: string[];
  /** ISO timestamp of when the contributor list was fetched. */
  snapshotAt: string;
}

const MAX_RESULTS = 6;
/** Clicks on these keep their own behaviour instead of starting a ripple. */
const INTERACTIVE = "a, button, input, [data-slot=popover-content]";

/** Pointer position in CSS px relative to the element handling the event. */
const localPoint = (event: PointerEvent<HTMLElement>) => {
  const rect = event.currentTarget.getBoundingClientRect();
  return [event.clientX - rect.left, event.clientY - rect.top] as const;
};

export const NotFoundHero = ({ logins, snapshotAt }: NotFoundHeroProps) => {
  const fieldRef = useRef<ContributorFieldHandle>(null);
  const [mode, setMode] = useState<FieldMode | null>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"about" | "search">("about");
  const [query, setQuery] = useState("");
  const hasField = logins.length > 0;

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();

    if (!needle) {
      return [];
    }

    return logins
      .filter((login) => login.toLowerCase().includes(needle))
      .toSorted(
        (a, b) =>
          Number(!a.toLowerCase().startsWith(needle)) -
            Number(!b.toLowerCase().startsWith(needle)) || a.localeCompare(b)
      )
      .slice(0, MAX_RESULTS);
  }, [logins, query]);

  const snapshotDate = new Date(snapshotAt).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  });

  const select = (login: string) => {
    fieldRef.current?.highlight(login);
    setOpen(false);
  };

  return (
    <section
      aria-labelledby="not-found-title"
      className="relative isolate mx-auto mt-10 flex min-h-[min(640px,78svh)] w-full max-w-7xl flex-col items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8"
      onPointerDown={(event) => {
        if (mode === "gpu" && !(event.target as Element).closest(INTERACTIVE)) {
          fieldRef.current?.ripple(...localPoint(event));
        }
      }}
      onPointerMove={(event) => fieldRef.current?.trail(...localPoint(event))}
    >
      {hasField && (
        <ContributorField
          className="absolute inset-0 -z-10 mask-[linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]"
          logins={logins}
          onModeChange={setMode}
          ref={fieldRef}
        />
      )}

      <div className="flex flex-col items-center gap-5 text-center">
        <h2
          className="text-foreground font-sans text-7xl font-semibold tracking-tighter sm:text-8xl"
          id="not-found-title"
        >
          404
        </h2>
        <p className="text-foreground">This page could not be found.</p>
        <a
          className={cn(buttonVariants({ size: "lg" }), "px-4")}
          href={ROUTES.HOME}
        >
          Go home
        </a>
      </div>

      {hasField && (
        <Popover
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) {
              setView("about");
              setQuery("");
            }
          }}
          open={open}
        >
          <PopoverTrigger
            render={
              <Button
                className="text-muted-foreground absolute bottom-8"
                size="default"
                variant="ghost"
              />
            }
          >
            <InfoIcon />
            About the background
          </PopoverTrigger>
          <PopoverContent className="w-80 gap-3 p-4" side="top" sideOffset={8}>
            {view === "about" ? (
              <>
                <PopoverTitle className="font-heading text-xl font-normal tracking-[-0.02em]">
                  The fabric of Shadcn Labs is open source
                </PopoverTitle>
                <p>
                  The background displays the{" "}
                  <span className="font-mono">{logins.length}</span>{" "}
                  contributors across{" "}
                  <a className="link-underline" href={ROUTES.CONTRIBUTORS}>
                    Shadcn Labs’ OSS projects
                  </a>
                  . Thank you for building with us.
                </p>
                {mode === "gpu" && (
                  <p>
                    Click the background to reveal the contributors or{" "}
                    <button
                      className="link-underline cursor-pointer"
                      onClick={() => setView("search")}
                      type="button"
                    >
                      search for your name
                    </button>
                    .
                  </p>
                )}
                <p className="text-muted-foreground">
                  Snapshot taken on {snapshotDate}.
                </p>
              </>
            ) : (
              <>
                <Button
                  className="-ml-2 self-start font-medium"
                  onClick={() => setView("about")}
                  variant="ghost"
                >
                  <ChevronLeftIcon data-icon="inline-start" />
                  Search for a name
                </Button>
                {/* Filtering is ours (prefix matches first), so cmdk only
                    handles arrow-key navigation and Enter to select. */}
                <Command
                  className="-mx-2 -mb-2 w-auto bg-transparent"
                  loop
                  shouldFilter={false}
                >
                  <CommandInput
                    aria-label="Contributor name"
                    autoFocus
                    onValueChange={setQuery}
                    placeholder="Name"
                    spellCheck={false}
                    value={query}
                  />
                  {query.trim() !== "" && (
                    <CommandList className="pt-1">
                      <CommandEmpty className="text-muted-foreground px-2 py-1.5 text-left">
                        No contributor matches “{query.trim()}”.
                      </CommandEmpty>
                      {results.map((login) => (
                        <CommandItem
                          key={login}
                          onSelect={() => select(login)}
                          value={login}
                        >
                          {login}
                          {/* A shortcut slot hides cmdk's trailing check icon. */}
                          <CommandShortcut>
                            <ChevronRightIcon className="text-muted-foreground" />
                          </CommandShortcut>
                        </CommandItem>
                      ))}
                    </CommandList>
                  )}
                </Command>
              </>
            )}
          </PopoverContent>
        </Popover>
      )}
    </section>
  );
};
