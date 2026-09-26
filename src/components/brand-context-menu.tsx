import { DownloadIcon, SquareDashedIcon, TypeIcon } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { getLogoMarkSVG, getLogoTypeSVG, LogoMark } from "@/components/logo";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

const getThemeColor = () =>
  document.documentElement.classList.contains("dark") ? "#fff" : "#111";

const copySvg = (build: (color: string) => string, label: string) => {
  void navigator.clipboard.writeText(build(getThemeColor()));
  toast.success(`${label} copied`);
};

interface BrandContextMenuProps {
  children?: ReactNode;
}

export const BrandContextMenu = ({ children }: BrandContextMenuProps) => (
  <ContextMenu>
    <ContextMenuTrigger>{children}</ContextMenuTrigger>
    <ContextMenuContent className="[&_a]:text-inherit [&_a:hover]:no-underline">
      <ContextMenuItem
        onClick={() => copySvg(getLogoMarkSVG, "Logomark as SVG")}
      >
        <LogoMark />
        Copy Logomark as SVG
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => copySvg(getLogoTypeSVG, "Logotype as SVG")}
      >
        <TypeIcon />
        Copy Logotype as SVG
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem render={<a href="/brand" />}>
        <SquareDashedIcon />
        Brand Guidelines
      </ContextMenuItem>
      <ContextMenuItem render={<a href="/shadcn-labs-brand.zip" download />}>
        <DownloadIcon />
        Download Brand Assets
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
);
