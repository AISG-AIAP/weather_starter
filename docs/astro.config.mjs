import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import mermaid from "astro-mermaid";

export default defineConfig({
  integrations: [
    mermaid({
      theme: "forest",
      autoTheme: true,
    }),
    starlight({
      title: "Weather Starter Docs",
      sidebar: [
        {
          label: "Guides",
          items: [
            { label: "Getting Started", slug: "guides/getting-started" },
            {
              label: "Development Workflow",
              slug: "guides/development-workflow",
            },
            { label: "Architecture", slug: "guides/architecture" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "Backend REST API", slug: "reference/backend-api" },
            { label: "Database Schema", slug: "reference/database-schema" },
            { label: "Frontend", slug: "reference/frontend" },
            { label: "Scripts", slug: "reference/scripts" },
            { label: "Configuration", slug: "reference/configuration" },
          ],
        },
      ],
    }),
  ],
});
