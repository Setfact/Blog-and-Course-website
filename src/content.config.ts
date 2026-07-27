import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const docs = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/docs" }),
  schema: z.object({
    title: z.string(),
    language: z.string().default('id'),
    draft: z.boolean().default(false),
    description: z.string().optional(),
    icon: z.string().optional(),
    learningPaths: z.array(z.object({
      path: z.string(),
      order: z.number().default(1),
    })).optional(),
    order: z.number().optional(),
  }),
});

const paths = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/paths" }),
  schema: z.object({
    title: z.string(),
    language: z.string().default('id'),
    draft: z.boolean().default(false),
    description: z.string().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    language: z.string().default('id'),
    draft: z.boolean().default(false),
    description: z.string().optional(),
    date: z.coerce.string(),
    category: z.string(),
    image: z.string().optional(),
  }),
});

export const collections = { docs, blog, paths };
