import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const courses = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/courses" }),
  schema: z.object({
    title: z.string(),
    titleEn: z.string().optional(),
    // Draft dan coming-soon dari CMS boleh disimpan bertahap.
    description: z.string().default(''),
    descriptionEn: z.string().optional(),
    category: z.enum(['networking', 'linux', 'automation', 'iot']),
    level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    status: z.enum(['draft', 'planned', 'published', 'archived']).default('draft'),
    cover: z.string().optional(),
    publishedAt: z.coerce.string(),
    updatedAt: z.coerce.string(),
    durationHours: z.number().default(1),
    tools: z.array(z.string()).default([]),
    outcomes: z.array(z.object({ id: z.string(), en: z.string().optional() })).default([]),
    projectTitle: z.string().optional(),
    projectDescription: z.string().optional(),
  }),
});

const modules = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/modules" }),
  schema: z.object({
    title: z.string(),
    titleEn: z.string().optional(),
    course: z.string(),
    order: z.number().default(1),
    description: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const lessons = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/docs" }),
  schema: z.object({
    title: z.string(),
    language: z.string().default('id'),
    draft: z.boolean().default(false),
    description: z.string().optional(),
    icon: z.string().optional(),
    course: z.string().optional(),
    module: z.string().optional(),
    order: z.number().optional(),
    durationMinutes: z.number().optional(),
  }),
});

const paths = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/paths" }),
  schema: z.object({
    title: z.string(),
    language: z.string().default('id'),
    draft: z.boolean().default(false),
    description: z.string().optional(),
    titleEn: z.string().optional(),
    descriptionEn: z.string().optional(),
    category: z.enum(['networking', 'linux', 'automation', 'iot']).default('networking'),
    target: z.string().optional(),
    targetEn: z.string().optional(),
    cover: z.string().optional(),
    courses: z.array(z.object({
      course: z.string(),
      order: z.number().default(1),
    })).default([]),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    language: z.string().default('id'),
    draft: z.boolean().default(false),
    description: z.string().optional(),
    author: z.string().optional(),
    date: z.coerce.string(),
    category: z.string(),
    image: z.string().optional(),
  }),
});

export const collections = { courses, modules, lessons, blog, paths };
