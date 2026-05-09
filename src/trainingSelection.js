import { courseCatalog, ENROLLED_COURSES_KEY, TRAINING_COURSE_KEY } from './data/trainingMockData';

export const TRAINING_SELECTION_CHANGE_EVENT = 'training-selection-change';
export const TRAINING_STAGE_KEY = 'selectedTrainingStageLevel';
export const TRAINING_EXERCISE_KEY = 'selectedTrainingExerciseId';

const parseStoredJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const getStoredEnrolledCourseIds = () =>
  typeof window === 'undefined' ? [] : parseStoredJson(window.localStorage.getItem(ENROLLED_COURSES_KEY), []);

export const getStoredSelectedCourseId = () =>
  typeof window === 'undefined' ? '' : window.localStorage.getItem(TRAINING_COURSE_KEY) || '';

export const getStoredPreferredStageLevel = () => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(TRAINING_STAGE_KEY) || '';
};

export const getStoredPreferredExerciseId = () => {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(TRAINING_EXERCISE_KEY) || '';
};

export const getTrainingSelectionSnapshot = () => {
  const enrolledCourseIds = getStoredEnrolledCourseIds();
  const selectedCourseId = getStoredSelectedCourseId();
  const selectedCourse =
    courseCatalog.find((course) => course.id === selectedCourseId) ||
    courseCatalog.find((course) => enrolledCourseIds.includes(course.id)) ||
    null;

  return {
    enrolledCourseIds,
    selectedCourseId,
    selectedCourse,
    preferredStageLevel: getStoredPreferredStageLevel(),
    preferredExerciseId: getStoredPreferredExerciseId(),
  };
};

export const notifyTrainingSelectionChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(TRAINING_SELECTION_CHANGE_EVENT));
  }
};

export const setStoredSelectedCourseId = (courseId) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TRAINING_COURSE_KEY, courseId);
  notifyTrainingSelectionChange();
};

export const setStoredEnrolledCourseIds = (courseIds) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ENROLLED_COURSES_KEY, JSON.stringify(courseIds));
  notifyTrainingSelectionChange();
};

export const setStoredPreferredStageLevel = (stageLevel) => {
  if (typeof window === 'undefined') return;
  if (stageLevel === '' || stageLevel === null || typeof stageLevel === 'undefined') {
    window.localStorage.removeItem(TRAINING_STAGE_KEY);
  } else {
    window.localStorage.setItem(TRAINING_STAGE_KEY, String(stageLevel));
  }
  notifyTrainingSelectionChange();
};

export const setStoredPreferredExerciseId = (exerciseId) => {
  if (typeof window === 'undefined') return;
  if (exerciseId === '' || exerciseId === null || typeof exerciseId === 'undefined') {
    window.localStorage.removeItem(TRAINING_EXERCISE_KEY);
  } else {
    window.localStorage.setItem(TRAINING_EXERCISE_KEY, String(exerciseId));
  }
  notifyTrainingSelectionChange();
};

export const subscribeTrainingSelection = (callback) => {
  if (typeof window === 'undefined') return () => {};

  const handleChange = () => callback();
  window.addEventListener(TRAINING_SELECTION_CHANGE_EVENT, handleChange);
  window.addEventListener('storage', handleChange);

  return () => {
    window.removeEventListener(TRAINING_SELECTION_CHANGE_EVENT, handleChange);
    window.removeEventListener('storage', handleChange);
  };
};
