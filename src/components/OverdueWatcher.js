import React, { useEffect, useState } from 'react';
import { courseCatalog, courseExerciseCatalog } from '../data/trainingMockData';
import {
  appendSimulatedEmail,
  formatRemaining,
  getAllProgress,
  getDeadlineStatus,
  markOverdueNotified,
  resolveUserKey,
  subscribeProgressChange,
} from '../exerciseProgress';

const SCAN_INTERVAL_MS = 60 * 1000; // FE-only: scan deadlines every 60s

const buildExerciseIndex = () => {
  const map = new Map();
  Object.values(courseExerciseCatalog).forEach((list) => {
    list.forEach((exercise) => {
      map.set(exercise.id, exercise);
    });
  });
  return map;
};

const findCourseName = (courseId) => {
  const course = courseCatalog.find((item) => item.id === courseId);
  return course?.name || courseId;
};

const OverdueWatcher = ({ authUser }) => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (!authUser) return undefined;

    const userKey = resolveUserKey(authUser);
    if (!userKey) return undefined;

    const exerciseIndex = buildExerciseIndex();

    const pushToast = (toast) => {
      setToasts((current) => [...current, toast]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 8000);
    };

    const runScan = () => {
      const progress = getAllProgress(userKey);
      let foundOverdue = false;

      Object.entries(progress).forEach(([exerciseId, entry]) => {
        if (entry.completedAt) return;
        if (entry.overdueNotifiedAt) return;
        if (getDeadlineStatus(entry) !== 'overdue') return;

        const exercise = exerciseIndex.get(exerciseId);
        if (!exercise) return;

        foundOverdue = true;

        const courseName = findCourseName(exercise.courseId);
        const recipient = authUser.email || authUser.mssv || '(không có email)';
        const overdueLabel = formatRemaining(entry);

        const emailPayload = {
          id: `${exerciseId}-${Date.now()}`,
          sentAt: new Date().toISOString(),
          to: recipient,
          subject: `Bạn đã trễ bài "${exercise.title}"`,
          exerciseId,
          exerciseTitle: exercise.title,
          courseName,
          deadline: entry.deadline,
          overdueLabel,
        };

        appendSimulatedEmail(emailPayload);
        markOverdueNotified(userKey, exerciseId);

        pushToast({
          id: emailPayload.id,
          title: 'Đã gửi email nhắc trễ bài',
          message: `${exercise.title} • ${courseName} • ${overdueLabel}`,
          to: recipient,
        });

        // Helpful for demo: mirror the simulated email to the dev console.
        // eslint-disable-next-line no-console
        console.info('[Simulated email]', emailPayload);
      });

      return foundOverdue;
    };

    runScan();
    const intervalId = window.setInterval(runScan, SCAN_INTERVAL_MS);
    const unsubscribe = subscribeProgressChange(runScan);

    return () => {
      window.clearInterval(intervalId);
      unsubscribe();
    };
  }, [authUser]);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-2xl border border-amber-200 bg-white/95 p-4 shadow-[0_18px_45px_rgba(245,158,11,0.25)] backdrop-blur"
        >
          <div className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-lg">
              📧
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-700">{toast.title}</p>
              <p className="mt-1 text-sm text-slate-700">{toast.message}</p>
              <p className="mt-1 text-xs text-slate-500">Đã giả lập gửi đến: {toast.to}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                setToasts((current) => current.filter((item) => item.id !== toast.id))
              }
              className="text-xs font-semibold text-slate-400 hover:text-slate-700"
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OverdueWatcher;
