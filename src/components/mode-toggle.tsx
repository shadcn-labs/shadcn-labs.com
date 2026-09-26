import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ModeToggle = () => {
  const [isDark, setIsDark] = useState(false);
  const applied = useRef(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    if (!applied.current) {
      applied.current = true;
      return;
    }
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground relative border-none bg-transparent transition-colors hover:bg-transparent dark:bg-transparent dark:hover:bg-transparent"
          />
        }
        onClick={() => setIsDark((dark) => !dark)}
      >
        <SunIcon className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <MoonIcon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        <span className="sr-only">Toggle theme</span>
      </TooltipTrigger>
      <TooltipContent>{isDark ? "Go Light" : "Go Dark"}</TooltipContent>
    </Tooltip>
  );
};
