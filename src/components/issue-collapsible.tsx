"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface IssueCollapsibleProps {
  children: ReactNode;
  count: number;
}

const IssueCollapsible = ({ children, count }: IssueCollapsibleProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible className="mt-2" open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1">
        <span
          aria-hidden="true"
          className="border-border flex-1 border-t border-dashed"
        />
        <CollapsibleTrigger
          render={<Button variant="secondary" className="rounded-full" />}
        >
          {open
            ? "Show less"
            : `Show ${count} more issue${count === 1 ? "" : "s"}`}
        </CollapsibleTrigger>
        <span
          aria-hidden="true"
          className="border-border flex-1 border-t border-dashed"
        />
      </div>
      <CollapsibleContent hiddenUntilFound>
        <ul className="space-y-2 pt-2">{children}</ul>
      </CollapsibleContent>
    </Collapsible>
  );
};

export { IssueCollapsible };
