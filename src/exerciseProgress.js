// Frontend-only simulation of exercise deadlines & overdue notifications.
// Each user gets a per-exercise progress entry stored in localStorage.
// When user opens an exercise the first time we lock in startedAt + deadline
// based on the exercise's durationDays. A background watcher in <App />
// scans for overdue entries and simulates sending a reminder email.

const PROGRESS_KEY = 'training:exerciseProgress';
const EMAIL_LOG_KEY = 'training:simulatedEmailLog';
const PROGRESS_CHANGE_EVENT = 'training-progress-change';
const EMAIL_LOG_CHANGE_EVENT = 'training-email-log-change';

// Default deadline window per stage if the exercise itself does not declare one.
const STAGE_DURATION_DAYS = { 1: 3, 2: 5, 3: 7, 4: 10 };

const safeParse = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const readAll = () => safeParse(localStorage.getItem(PROGRESS_KEY), {});

const readUserStore = (userKey) => {
  if (!userKey) return {};
  const all = readAll();
  return all[userKey] || {};
};

const writeUserStore = (userKey, store) => {
  if (!userKey) return;
  const all = readAll();
  all[userKey] = store;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  window.dispatchEvent(new CustomEvent(PROGRESS_CHANGE_EVENT));
};

export const resolveUserKey = (user) => {
  if (!user) return '';
  return String(user.id || user.user_id || user.email || user.mssv || 'guest');
};

export const getDurationDays = (exercise) => {
  if (!exercise) return 5;
  if (typeof exercise.durationDays === 'number' && exercise.durationDays > 0) {
    return exercise.durationDays;
  }
  return STAGE_DURATION_DAYS[exercise.stageLevel] || 5;
};

export const getExerciseProgress = (userKey, exerciseId) => {
  if (!userKey || !exerciseId) return null;
  return readUserStore(userKey)[exerciseId] || null;
};

export const getAllProgress = (userKey) => readUserStore(userKey);

export const startExercise = (userKey, exercise) => {
  if (!userKey || !exercise?.id) return null;
  const store = readUserStore(userKey);
  if (store[exercise.id]) return store[exercise.id];

  const now = new Date();
  const durationDays = getDurationDays(exercise);
  const deadline = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const entry = {
    startedAt: now.toISOString(),
    deadline: deadline.toISOString(),
    durationDays,
    completedAt: null,
    overdueNotifiedAt: null,
  };

  store[exercise.id] = entry;
  writeUserStore(userKey, store);
  return entry;
};

export const completeExercise = (userKey, exerciseId) => {
  const store = readUserStore(userKey);
  if (!store[exerciseId]) return null;
  store[exerciseId] = { ...store[exerciseId], completedAt: new Date().toISOString() };
  writeUserStore(userKey, store);
  return store[exerciseId];
};

export const reopenExercise = (userKey, exerciseId) => {
  const store = readUserStore(userKey);
  if (!store[exerciseId]) return null;
  store[exerciseId] = { ...store[exerciseId], completedAt: null };
  writeUserStore(userKey, store);
  return store[exerciseId];
};

export const markOverdueNotified = (userKey, exerciseId) => {
  const store = readUserStore(userKey);
  if (!store[exerciseId]) return;
  store[exerciseId] = { ...store[exerciseId], overdueNotifiedAt: new Date().toISOString() };
  writeUserStore(userKey, store);
};

export const simulateOverdueDeadline = (userKey, exerciseId) => {
  const store = readUserStore(userKey);
  const entry = store[exerciseId];
  if (!entry) return;
  const pastIso = new Date(Date.now() - 60 * 1000).toISOString();
  store[exerciseId] = {
    ...entry,
    startedAt: pastIso,
    deadline: pastIso,
    overdueNotifiedAt: null,
    completedAt: null,
  };
  writeUserStore(userKey, store);
};

export const getDeadlineStatus = (entry) => {
  if (!entry) return 'idle';
  if (entry.completedAt) return 'completed';
  const now = Date.now();
  const deadlineMs = new Date(entry.deadline).getTime();
  if (Number.isNaN(deadlineMs)) return 'idle';
  if (now > deadlineMs) return 'overdue';
  if (deadlineMs - now < 24 * 60 * 60 * 1000) return 'soon';
  return 'ontime';
};

export const formatRemaining = (entry) => {
  if (!entry) return '';
  const deadlineMs = new Date(entry.deadline).getTime();
  if (Number.isNaN(deadlineMs)) return '';
  const ms = deadlineMs - Date.now();

  if (ms <= 0) {
    const overdue = Math.abs(ms);
    const days = Math.floor(overdue / (24 * 60 * 60 * 1000));
    if (days > 0) return `Trễ ${days} ngày`;
    const hours = Math.floor(overdue / (60 * 60 * 1000));
    if (hours > 0) return `Trễ ${hours} giờ`;
    const minutes = Math.floor(overdue / (60 * 1000));
    return `Trễ ${Math.max(1, minutes)} phút`;
  }

  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days > 0) {
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    return `Còn ${days} ngày ${hours} giờ`;
  }
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours > 0) {
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    return `Còn ${hours} giờ ${minutes} phút`;
  }
  const minutes = Math.floor(ms / (60 * 1000));
  return `Còn ${Math.max(1, minutes)} phút`;
};

export const formatDateTime = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Frontend-only progression: recompute exercise.status from completion store so
// finishing a practice automatically unlocks the next one in the same stage.
export const applyEffectiveStatuses = (userKey, exercises) => {
  if (!Array.isArray(exercises) || exercises.length === 0) return exercises || [];
  const store = readUserStore(userKey);

  const stageGroups = new Map();
  exercises.forEach((exercise) => {
    const key = exercise.stageLevel ?? 0;
    if (!stageGroups.has(key)) stageGroups.set(key, []);
    stageGroups.get(key).push(exercise);
  });

  const overrides = {};

  stageGroups.forEach((stageExercises) => {
    const practices = stageExercises.filter((ex) => ex.type !== 'assessment');
    const assessments = stageExercises.filter((ex) => ex.type === 'assessment');

    let firstUnfinishedIdx = -1;
    practices.forEach((ex, i) => {
      const completed = !!store[ex.id]?.completedAt;
      if (completed) {
        overrides[ex.id] = 'Đã làm';
      } else if (firstUnfinishedIdx === -1) {
        firstUnfinishedIdx = i;
      }
    });

    practices.forEach((ex, i) => {
      if (overrides[ex.id]) return;
      if (ex.status === 'Khóa') {
        overrides[ex.id] = 'Khóa';
        return;
      }
      overrides[ex.id] = i === firstUnfinishedIdx ? 'Đang mở' : 'Sắp mở';
    });

    const allPracticesDone =
      practices.length > 0 && practices.every((ex) => overrides[ex.id] === 'Đã làm');

    assessments.forEach((ex) => {
      if (store[ex.id]?.completedAt) {
        overrides[ex.id] = 'Đã làm';
        return;
      }
      if (ex.status === 'Khóa') {
        overrides[ex.id] = 'Khóa';
        return;
      }
      overrides[ex.id] = allPracticesDone ? 'Đang mở' : 'Sắp mở';
    });
  });

  return exercises.map((ex) => ({ ...ex, status: overrides[ex.id] ?? ex.status }));
};

export const subscribeProgressChange = (handler) => {
  window.addEventListener(PROGRESS_CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(PROGRESS_CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};

export const appendSimulatedEmail = (entry) => {
  const log = safeParse(localStorage.getItem(EMAIL_LOG_KEY), []);
  log.unshift(entry);
  const trimmed = log.slice(0, 50);
  localStorage.setItem(EMAIL_LOG_KEY, JSON.stringify(trimmed));
  window.dispatchEvent(new CustomEvent(EMAIL_LOG_CHANGE_EVENT));
};

export const getSimulatedEmailLog = () => safeParse(localStorage.getItem(EMAIL_LOG_KEY), []);

export const subscribeEmailLogChange = (handler) => {
  window.addEventListener(EMAIL_LOG_CHANGE_EVENT, handler);
  return () => window.removeEventListener(EMAIL_LOG_CHANGE_EVENT, handler);
};
