import { getCollection, type CollectionEntry } from 'astro:content';

export type Language = 'id' | 'en';
export type CourseCategory = 'networking' | 'linux' | 'automation' | 'iot';
export type CourseStatus = 'planned' | 'published';

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

export async function loadLearningData(): Promise<LearningData> {
  const [courseEntries, moduleEntries, lessonEntries, pathEntries] = await Promise.all([
    getCollection('courses'),
    getCollection('modules'),
    getCollection('lessons'),
    getCollection('paths'),
  ]);

  const publishedLessons = lessonEntries.filter((entry) => entry.data.draft !== true);
  const courses = courseEntries
    .filter((entry) => entry.data.status !== 'draft' && entry.data.status !== 'archived')
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
      const status: CourseStatus = entry.data.status === 'published' ? 'published' : 'planned';

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
        tools: entry.data.tools,
        outcomes: entry.data.outcomes.map((outcome) => localize(outcome.id, outcome.en)),
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

export async function loadCourses(): Promise<Course[]> { return (await loadLearningData()).courses; }
export async function loadLearningPaths(): Promise<LearningPath[]> { return (await loadLearningData()).paths; }
export async function getCourseBySlug(slug: string): Promise<Course | undefined> { return (await loadCourses()).find((course) => course.slug === slug); }
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
