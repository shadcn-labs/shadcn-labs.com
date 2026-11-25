import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";

const COMMAND = "npm i goeist";

export const InstallCard = () => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : `Copy ${COMMAND}`}
      onClick={async () => {
        await navigator.clipboard.writeText(COMMAND);
        setCopied(true);
      }}
      className="bg-muted/50 hover:bg-muted focus-visible:ring-ring/50 dark:border-border flex cursor-pointer flex-col gap-4 rounded-2xl p-5 text-left transition-colors outline-none focus-visible:ring-3 dark:border dark:bg-[#212017]"
    >
      <span className="flex w-full items-center justify-between gap-2 text-sm font-medium">
        Install
        {copied ? (
          <CheckIcon className="size-4 text-emerald-500" aria-hidden="true" />
        ) : (
          <CopyIcon className="size-4" aria-hidden="true" />
        )}
      </span>
      <span className="font-mono text-2xl font-medium tracking-[-0.02em] sm:text-3xl">
        {COMMAND}
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </button>
  );
};
