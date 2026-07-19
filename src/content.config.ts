import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';

// Blog posts live as Markdown under src/content/blog. Static build, Shiki-highlighted code, no
// client runtime — same rules as the rest of the site.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    author: z.string().default('cargopete'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// The nest catalogue — structured data, not prose, so it lives as one JSON file. Each entry is a
// prebuilt nest (or a planned one); the /nests page renders them grouped by honest status.
const nests = defineCollection({
  loader: file('./src/content/nests.json'),
  schema: z.object({
    name: z.string(),
    category: z.string(),
    tier: z.number().int().min(0).max(3),
    status: z.enum(['available', 'building', 'planned']),
    chains: z.array(z.string()),
    factory: z.boolean().default(false),
    complexity: z.enum(['trivial', 'low', 'medium', 'high']),
    summary: z.string(),
    events: z.string(),
    command: z.string().optional(),
    repo: z.string().url().optional(),
    note: z.string().optional(),
  }),
});

export const collections = { blog, nests };
