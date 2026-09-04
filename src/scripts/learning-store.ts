const STORAGE_KEY = 'phinisi-learning-v1';

export interface LearningState {
  xp: number;
  streak: number;
  lastStudyDate: string | null;
  completedActivities: string[];
  completedLessons: string[];
  badges: string[];
  lastVisitedLessons: Record<string, string>;
}

interface CompleteActivityInput {
  activityId: string;
  courseSlug: string;
  lessonId?: string;
  xp: number;
  completesLesson?: boolean;
}

const emptyState = (): LearningState => ({
  xp: 0,
  streak: 0,
  lastStudyDate: null,
  completedActivities: [],
  completedLessons: [],
  badges: [],
  lastVisitedLessons: {},
});

const localDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const yesterdayKey = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return localDateKey(yesterday);
};

const deriveBadges = (state: LearningState) => {
  const securityLessons = state.completedLessons.filter((lesson) => lesson.startsWith('security-fundamentals/')).length;
  const badges = new Set(state.badges);

  if (state.completedActivities.length >= 1) badges.add('langkah-pertama');
  if (securityLessons >= 1) badges.add('security-starter');
  if (securityLessons >= 5) badges.add('security-guardian');
  if (state.streak >= 3) badges.add('streak-3');

  return [...badges];
};

export const getLearningState = (): LearningState => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return emptyState();
    const parsed = JSON.parse(saved) as Partial<LearningState>;
    return {
      xp: Number(parsed.xp) || 0,
      streak: Number(parsed.streak) || 0,
      lastStudyDate: parsed.lastStudyDate ?? null,
      completedActivities: Array.isArray(parsed.completedActivities) ? parsed.completedActivities : [],
      completedLessons: Array.isArray(parsed.completedLessons) ? parsed.completedLessons : [],
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
      lastVisitedLessons: parsed.lastVisitedLessons && typeof parsed.lastVisitedLessons === 'object'
        ? parsed.lastVisitedLessons
        : {},
    };
  } catch {
    return emptyState();
  }
};

export const setLastVisitedLesson = (courseSlug: string, href: string) => {
  const state = getLearningState();
  if (state.lastVisitedLessons[courseSlug] === href) return state;
  state.lastVisitedLessons[courseSlug] = href;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('phinisi-progress-updated', { detail: state }));
  return state;
};

export const getCourseProgress = (courseSlug: string, totalLessons: number) => {
  const state = getLearningState();
  const completedLessons = state.completedLessons.filter((lesson) => lesson.startsWith(`${courseSlug}/`)).length;
  const percent = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
  return {
    completedLessons,
    percent,
    resumeHref: state.lastVisitedLessons[courseSlug],
  };
};

export const completeActivity = ({
  activityId,
  courseSlug,
  lessonId,
  xp,
  completesLesson = false,
}: CompleteActivityInput) => {
  const state = getLearningState();
  const activityKey = `${courseSlug}:${activityId}`;
  const firstCompletion = !state.completedActivities.includes(activityKey);

  if (firstCompletion) {
    state.completedActivities.push(activityKey);
    state.xp += xp;

    const today = localDateKey();
    if (state.lastStudyDate !== today) {
      state.streak = state.lastStudyDate === yesterdayKey() ? state.streak + 1 : 1;
      state.lastStudyDate = today;
    }
  }

  if (completesLesson && lessonId) {
    const lessonKey = `${courseSlug}/${lessonId}`;
    if (!state.completedLessons.includes(lessonKey)) state.completedLessons.push(lessonKey);
  }

  state.badges = deriveBadges(state);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('phinisi-progress-updated', { detail: state }));

  return { state, firstCompletion, awardedXp: firstCompletion ? xp : 0 };
};
