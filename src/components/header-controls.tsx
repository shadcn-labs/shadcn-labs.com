import { ModeToggle } from "@/components/mode-toggle";
import {
  SoundEffects,
  SoundToggle,
  useSoundMuted,
} from "@/components/ui/sound";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const HeaderControls = () => {
  const muted = useSoundMuted();

  return (
    <SoundEffects>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger render={<SoundToggle />} />
          <TooltipContent>
            {muted ? "Unmute sounds" : "Mute sounds"}
          </TooltipContent>
        </Tooltip>

        <ModeToggle />
      </TooltipProvider>
    </SoundEffects>
  );
};
