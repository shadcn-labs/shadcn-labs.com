import { ModeToggle } from "@/components/mode-toggle";
import { SoundToggle } from "@/components/ui/sound";
import { TooltipProvider } from "@/components/ui/tooltip";

export const HeaderControls = () => (
  <TooltipProvider>
    <SoundToggle />
    <ModeToggle />
  </TooltipProvider>
);
