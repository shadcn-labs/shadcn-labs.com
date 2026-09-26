"use client";

import { useState } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECTS } from "@/constants/projects";
import type { ProjectCategory } from "@/constants/projects";

export const ProjectList = () => {
  const [filter, setFilter] = useState<ProjectCategory | "all">("all");

  const counts = {
    all: PROJECTS.length,
    ports: PROJECTS.filter((p) => p.category === "ports").length,
    registries: PROJECTS.filter((p) => p.category === "registries").length,
    skills: PROJECTS.filter((p) => p.category === "skills").length,
    templates: PROJECTS.filter((p) => p.category === "templates").length,
  };

  const filteredProjects =
    filter === "all" ? PROJECTS : PROJECTS.filter((p) => p.category === filter);

  return (
    <>
      <div className="mb-1 flex items-center justify-between">
        <h2>
          <a href="#projects" className="view-container-title">
            PROJECTS
          </a>
        </h2>
        <Select
          value={filter}
          onValueChange={(next) => {
            if (next !== null) {
              setFilter(next);
            }
          }}
        >
          <SelectTrigger
            size="sm"
            className="text-muted-foreground hover:text-foreground border-none bg-transparent transition-colors dark:bg-transparent dark:hover:bg-transparent"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-[140px]">
            <SelectGroup>
              <SelectItem value="all">
                all{" "}
                <span className="text-muted-foreground ml-1">{counts.all}</span>
              </SelectItem>
              <SelectItem value="registries">
                registries{" "}
                <span className="text-muted-foreground ml-1">
                  {counts.registries}
                </span>
              </SelectItem>
              <SelectItem value="templates">
                templates{" "}
                <span className="text-muted-foreground ml-1">
                  {counts.templates}
                </span>
              </SelectItem>
              <SelectItem value="ports">
                ports{" "}
                <span className="text-muted-foreground ml-1">
                  {counts.ports}
                </span>
              </SelectItem>
              <SelectItem value="skills">
                skills{" "}
                <span className="text-muted-foreground ml-1">
                  {counts.skills}
                </span>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <ul className="space-y-2">
        {filteredProjects.map((project) => (
          <li key={project.name}>
            {project.isNew ? (
              <span className="inline-flex items-center gap-2">
                <a target="_blank" href={project.url}>
                  {project.name}
                </a>
                <img
                  src="/new.gif"
                  alt="new"
                  className="h-6 w-auto align-middle"
                />
              </span>
            ) : (
              <a target="_blank" href={project.url}>
                {project.name}
              </a>
            )}
            <br />
            {project.description}
          </li>
        ))}
      </ul>
    </>
  );
};
