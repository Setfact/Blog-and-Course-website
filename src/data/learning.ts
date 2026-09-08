import { getCollection, type CollectionEntry } from 'astro:content';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';

export type Language = 'id' | 'en';
export type CourseCategory = 'networking' | 'linux' | 'automation' | 'iot';
export type CourseStatus = 'draft' | 'planned' | 'published' | 'archived';

interface DiskCourseData {
  title?: string;
  titleEn?: string;
  category?: CourseCategory;
  description?: string;
  descriptionEn?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  status?: CourseStatus;
  cover?: string;
  publishedAt?: string;
  updatedAt?: string;
  durationHours?: number;
  tools?: string[];
  outcomes?: Array<{ id: string; en?: string }>;
  projectTitle?: string;
  projectDescription?: string;
}

function getDiskCourses(): Map<string, DiskCourseData> {
  const map = new Map<string, DiskCourseData>();
  try {
    const dir = path.join(process.cwd(), 'src/content/courses');
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
        const slug = file.replace(/\.(md|mdx)$/, '');
        try {
          const content = fs.readFileSync(path.join(dir, file), 'utf-8');
          const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
          if (match) {
            const parsed = yaml.parse(match[1]);
            if (parsed && typeof parsed === 'object') {
              map.set(slug, parsed as DiskCourseData);
            }
          }
        } catch {
          // ignore parsing errors on corrupt files
        }
      }
    }
  } catch {
    // ignore filesystem access errors
  }
  return map;
}

export interface LocalizedText { id: string; en: string; }

export interface CourseModule {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  order: number;
  lessonCount: number;
}

export interface Course {
  slug: string;
  title: string;
  titleEn: string;
  category: CourseCategory;
  description: LocalizedText;
  level: 'beginner' | 'intermediate' | 'advanced';
  durationHours: number;
  moduleCount: number;
  lessonCount: number;
  status: CourseStatus;
  cover: string;
  publishedAt: string;
  updatedAt: string;
  tools: string[];
  outcomes: LocalizedText[];
  projectTitle?: string;
  projectDescription?: string;
  contentHref?: Partial<Record<Language, string>>;
  learningHref?: Partial<Record<Language, string>>;
  modules: CourseModule[];
}

export interface LearningPath {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  category: CourseCategory;
  target: LocalizedText;
  cover: string;
  courseSlugs: string[];
}

export interface LearningData { courses: Course[]; paths: LearningPath[]; }

export const categoryLabels: Record<CourseCategory, LocalizedText> = {
  networking: { id: 'Networking', en: 'Networking' },
  linux: { id: 'Linux', en: 'Linux' },
  automation: { id: 'Automation', en: 'Automation' },
  iot: { id: 'Internet of Things', en: 'Internet of Things' },
};

const localize = (id: string | undefined, en: string | undefined): LocalizedText => ({
  id: id ?? '',
  en: en?.trim() || id || '',
});

const publicImage = (value: string | undefined, directory: 'courses' | 'learning-paths') => {
  if (!value) return '/images/courses/security-fundamentals.webp';
  if (value.startsWith('/')) return value;
  return `/images/${directory}/${value}`;
};

const isCourseOverview = (entry: CollectionEntry<'lessons'>) => Boolean(entry.data.course && !entry.data.module);

export async function loadLearningData(options: { includeAll?: boolean } = {}): Promise<LearningData> {
  const [courseEntries, moduleEntries, lessonEntries, pathEntries] = await Promise.all([
    getCollection('courses'),
    getCollection('modules'),
    getCollection('lessons'),
    getCollection('paths'),
  ]);

  const diskCourses = getDiskCourses();

  // Sinkronkan data dari disk file agar perubahan status dan metadata realtime
  const allEntries = [...courseEntries];
  for (const [slug, diskData] of diskCourses.entries()) {
    const existing = allEntries.find((e) => e.id === slug);
    if (existing) {
      existing.data = {
        ...existing.data,
        ...diskData,
        status: diskData.status || existing.data.status || 'draft',
      };
    } else {
      allEntries.push({
        id: slug,
        collection: 'courses',
        data: {
          title: diskData.title || slug,
          titleEn: diskData.titleEn || diskData.title || slug,
          category: diskData.category || 'networking',
          description: diskData.description || '',
          descriptionEn: diskData.descriptionEn || '',
          level: diskData.level || 'beginner',
          durationHours: diskData.durationHours || 6,
          status: diskData.status || 'draft',
          cover: diskData.cover || '',
          publishedAt: diskData.publishedAt || new Date().toISOString().split('T')[0],
          updatedAt: diskData.updatedAt || new Date().toISOString().split('T')[0],
          tools: diskData.tools || [],
          outcomes: diskData.outcomes || [],
          projectTitle: diskData.projectTitle,
          projectDescription: diskData.projectDescription,
        },
      } as any);
    }
  }

  const publishedLessons = lessonEntries.filter((entry) => entry.data.draft !== true);
  const courses = allEntries
    .filter((entry) => {
      if (options.includeAll) return true;
      return entry.data.status !== 'draft' && entry.data.status !== 'archived';
    })
    .map((entry): Course => {
      const courseModules = moduleEntries
        .filter((module) => module.data.course === entry.id && module.data.draft !== true)
        .sort((a, b) => a.data.order - b.data.order)
        .map((module): CourseModule => ({
          slug: module.id,
          title: localize(module.data.title, module.data.titleEn),
          description: localize(module.data.description, undefined),
          order: module.data.order,
          lessonCount: publishedLessons.filter((lesson) => lesson.data.module === module.id).length,
        }));
      const courseLessons = publishedLessons.filter((lesson) => lesson.data.course === entry.id && Boolean(lesson.data.module));
      const overview = publishedLessons.find((lesson) => lesson.data.course === entry.id && isCourseOverview(lesson));
      const docsSlug = overview?.id.replace(/\/index$/, '');
      const status: CourseStatus = (entry.data.status as CourseStatus) || 'draft';

      return {
        slug: entry.id,
        title: entry.data.title,
        titleEn: entry.data.titleEn?.trim() || entry.data.title,
        category: entry.data.category,
        description: localize(entry.data.description, entry.data.descriptionEn),
        level: entry.data.level,
        durationHours: entry.data.durationHours,
        moduleCount: courseModules.length,
        lessonCount: courseLessons.length,
        status,
        cover: publicImage(entry.data.cover, 'courses'),
        publishedAt: entry.data.publishedAt,
        updatedAt: entry.data.updatedAt,
        tools: entry.data.tools || [],
        outcomes: (entry.data.outcomes || []).map((outcome: any) => localize(outcome.id, outcome.en)),
        projectTitle: entry.data.projectTitle,
        projectDescription: entry.data.projectDescription,
        contentHref: docsSlug ? { id: `/docs/${docsSlug}` } : undefined,
        learningHref: status === 'published' && overview ? { id: `/learn/${entry.id}` } : undefined,
        modules: courseModules,
      };
    })
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || a.title.localeCompare(b.title));

  const paths = pathEntries
    .filter((entry) => entry.data.draft !== true)
    .map((entry): LearningPath => ({
      slug: entry.id,
      title: localize(entry.data.title, entry.data.titleEn),
      description: localize(entry.data.description, entry.data.descriptionEn),
      category: entry.data.category,
      target: localize(entry.data.target, entry.data.targetEn),
      cover: publicImage(entry.data.cover, 'learning-paths'),
      courseSlugs: [...entry.data.courses].sort((a, b) => a.order - b.order).map((item) => item.course),
    }));

  return { courses, paths };
}

export async function loadCourses(): Promise<Course[]> { return (await loadLearningData({ includeAll: false })).courses; }
export async function loadAllCourses(): Promise<Course[]> { return (await loadLearningData({ includeAll: true })).courses; }
export async function loadLearningPaths(): Promise<LearningPath[]> { return (await loadLearningData()).paths; }
export async function getCourseBySlug(slug: string, options: { includeDrafts?: boolean } = {}): Promise<Course | undefined> {
  const courses = options.includeDrafts ? await loadAllCourses() : await loadCourses();
  return courses.find((course) => course.slug === slug);
}
export async function getPathBySlug(slug: string): Promise<LearningPath | undefined> { return (await loadLearningPaths()).find((path) => path.slug === slug); }

export function getCoursesForPath(path: LearningPath, courses: Course[]): Course[] {
  return path.courseSlugs
    .map((slug) => courses.find((course) => course.slug === slug))
    .filter((course): course is Course => Boolean(course));
}

export async function getPathsForCourse(courseSlug: string): Promise<LearningPath[]> {
  return (await loadLearningPaths()).filter((path) => path.courseSlugs.includes(courseSlug));
}

export function isRecentlyPublished(course: Course, days = 30): boolean {
  return Date.now() - Date.parse(course.publishedAt) <= days * 86_400_000;
}

export function isRecentlyUpdated(course: Course): boolean {
  return Date.parse(course.updatedAt) > Date.parse(course.publishedAt);
}
