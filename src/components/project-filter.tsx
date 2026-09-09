import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectCategory } from "@/constants/projects";

interface ProjectFilterProps {
  value: ProjectCategory | "all";
  onChange: (value: ProjectCategory | "all") => void;
  counts: Record<ProjectCategory | "all", number>;
}

export const ProjectFilter = ({
  value,
  onChange,
  counts,
}: ProjectFilterProps) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="text-muted-foreground hover:text-foreground h-auto border-none bg-transparent p-0 transition-colors">
      <SelectValue />
    </SelectTrigger>
    <SelectContent className="min-w-[140px]">
      <SelectItem value="all">
        all <span className="text-muted-foreground ml-1">{counts.all}</span>
      </SelectItem>
      <SelectItem value="registries">
        registries{" "}
        <span className="text-muted-foreground ml-1">{counts.registries}</span>
      </SelectItem>
      <SelectItem value="templates">
        templates{" "}
        <span className="text-muted-foreground ml-1">{counts.templates}</span>
      </SelectItem>
      <SelectItem value="ports">
        ports <span className="text-muted-foreground ml-1">{counts.ports}</span>
      </SelectItem>
    </SelectContent>
  </Select>
);
