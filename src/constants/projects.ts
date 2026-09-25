export type ProjectCategory = "registries" | "templates" | "ports" | "skills";

export const PROJECTS = [
  {
    category: "templates" as ProjectCategory,
    description:
      "shadcn/ui registry template with docs, landing page, and agent support",
    name: "startercn",
    url: "https://startercn.vercel.app",
  },
  {
    category: "skills" as ProjectCategory,
    description: "agent skills for shadcn registries & more",
    name: "skills",
    url: "https://www.skills.sh/shadcn-labs/skills",
  },
  {
    category: "registries" as ProjectCategory,
    description: "terminal UI components for React, built on Ink and OpenTUI",
    name: "termcn",
    url: "https://termcn.dev",
  },
  {
    category: "registries" as ProjectCategory,
    description: "video components for React, built on Editframe",
    name: "framecn",
    url: "https://framecn.dev",
  },
  {
    category: "registries" as ProjectCategory,
    description: "open graph image components for React, built on Satori",
    name: "ogimagecn",
    url: "https://ogimagecn.com",
  },
  {
    category: "registries" as ProjectCategory,
    description:
      "customizable and production-ready AI agent recipes, built on Eve and Flue",
    name: "agentcn",
    url: "https://agentcn.run",
  },
  {
    category: "ports" as ProjectCategory,
    description: "CSS-in-JS port of shadcn/ui, built on StyleX",
    name: "shadcn-cssinjs",
    url: "https://shadcn-cssinjs.com",
  },
  {
    category: "registries" as ProjectCategory,
    description:
      "ChatGPT/Claude/MCP app UI components for React, built on Base UI",
    name: "mcpcn",
    url: "https://mcpcn.dev",
  },
  {
    category: "registries" as ProjectCategory,
    description:
      "email components for React, built on React Email, MJML React and JSX Email",
    name: "emailcn",
    url: "https://emailcn.run",
  },
  {
    category: "registries" as ProjectCategory,
    description: "PDF components for React, built on Takumi and Forme",
    name: "pdfcn",
    url: "https://pdfcn.dev",
  },
  {
    category: "registries" as ProjectCategory,
    description: "rich text editor components for React, built on Tiptap",
    name: "editorcn",
    url: "https://editorcn.vercel.app",
  },
  {
    category: "registries" as ProjectCategory,
    description: "shader components for React, built on vgpu and TypeGPU",
    isNew: true,
    name: "shadercn",
    url: "https://shadercn.run",
  },
];
