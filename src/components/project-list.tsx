"use client";

import { useState } from "react";

import { PROJECTS } from "@/constants/projects";
import type { ProjectCategory } from "@/constants/projects";

import { ProjectFilter } from "./project-filter";

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
        <h2>PROJECTS</h2>
        <ProjectFilter value={filter} onChange={setFilter} counts={counts} />
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
