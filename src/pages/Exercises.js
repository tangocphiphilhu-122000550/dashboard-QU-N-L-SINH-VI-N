import React, { useEffect, useMemo, useState } from 'react';
import {
  ENROLLED_COURSES_KEY,
  TRAINING_COURSE_KEY,
  assessmentPreview,
  courseCatalog,
  courseExerciseCatalog,
} from '../data/trainingMockData';
import {
  getStoredPreferredExerciseId,
  getStoredPreferredStageLevel,
  getStoredSelectedCourseId,
  setStoredPreferredExerciseId,
  setStoredPreferredStageLevel,
  setStoredSelectedCourseId,
  subscribeTrainingSelection,
} from '../trainingSelection';
import { getStoredUser, sendOverdueEmailAPI } from '../auth';
import {
  applyEffectiveStatuses,
  appendSimulatedEmail,
  completeExercise,
  formatDateTime,
  formatRemaining,
  getDeadlineStatus,
  getDurationDays,
  getExerciseProgress,
  markOverdueNotified,
  reopenExercise,
  resolveUserKey,
  simulateOverdueDeadline,
  startExercise,
  subscribeProgressChange,
} from '../exerciseProgress';

const deadlineBadgeClass = (status) => {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'overdue':
      return 'bg-rose-100 text-rose-700 border border-rose-200';
    case 'soon':
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    case 'ontime':
      return 'bg-sky-100 text-sky-700 border border-sky-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
};

const deadlineBadgeLabel = (status, entry) => {
  if (!entry) return 'Chưa bắt đầu';
  if (status === 'completed') return 'Đã hoàn thành';
  if (status === 'overdue') return formatRemaining(entry);
  if (status === 'soon') return `Sắp hết hạn • ${formatRemaining(entry)}`;
  return formatRemaining(entry);
};

const getPreferredExercise = (exerciseList) =>
  exerciseList.find((exercise) => exercise.status === 'Đang mở') ||
  exerciseList.find((exercise) => exercise.status === 'Sắp mở') ||
  exerciseList[0];

const getStageFilterValue = (stageLevel) => {
  if (!stageLevel) return 'Tất cả';
  return `Cấp ${stageLevel}`;
};

const Exercises = () => {
  const [enrolledCourseIds] = useState(() => {
    const saved = localStorage.getItem(ENROLLED_COURSES_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const enrolledCourses = useMemo(
    () => courseCatalog.filter((course) => enrolledCourseIds.includes(course.id)),
    [enrolledCourseIds]
  );
  const [selectedCourseId, setSelectedCourseId] = useState(() => {
    const savedCourseId = localStorage.getItem(TRAINING_COURSE_KEY);
    if (savedCourseId && enrolledCourseIds.includes(savedCourseId)) return savedCourseId;
    return enrolledCourseIds[0] || '';
  });
  const [stageFilter, setStageFilter] = useState(() => getStageFilterValue(getStoredPreferredStageLevel()));

  const [progressTick, setProgressTick] = useState(0);
  const userKey = useMemo(() => resolveUserKey(getStoredUser()), []);

  const currentExercises = useMemo(
    () => {
      const base = selectedCourseId ? courseExerciseCatalog[selectedCourseId] || [] : [];
      return applyEffectiveStatuses(userKey, base);
    },
    // progressTick forces recompute when a user marks an exercise as completed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCourseId, userKey, progressTick]
  );

  const filteredExercises = useMemo(
    () =>
      currentExercises.filter((exercise) => {
        const matchStage = stageFilter === 'Tất cả' || `Cấp ${exercise.stageLevel}` === stageFilter;
        return matchStage;
      }),
    [currentExercises, stageFilter]
  );

  const [selectedExerciseId, setSelectedExerciseId] = useState(getPreferredExercise(currentExercises)?.id || '');
  const [submissionCode, setSubmissionCode] = useState(getPreferredExercise(currentExercises)?.starterCode || '');

  // Re-render every minute so countdowns stay accurate, and react to localStorage progress changes.
  useEffect(() => {
    const intervalId = window.setInterval(() => setProgressTick((value) => value + 1), 60 * 1000);
    const unsubscribe = subscribeProgressChange(() => setProgressTick((value) => value + 1));
    return () => {
      window.clearInterval(intervalId);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!selectedCourseId && enrolledCourses.length) {
      setSelectedCourseId(enrolledCourses[0].id);
    }
  }, [selectedCourseId, enrolledCourses]);

  useEffect(
    () =>
      subscribeTrainingSelection(() => {
        const nextSelectedCourseId = getStoredSelectedCourseId();
        if (nextSelectedCourseId && enrolledCourseIds.includes(nextSelectedCourseId)) {
          setSelectedCourseId(nextSelectedCourseId);
        }
      }),
    [enrolledCourseIds]
  );

  useEffect(() => {
    if (!selectedCourseId) return;
    setStoredSelectedCourseId(selectedCourseId);
  }, [selectedCourseId]);

  useEffect(() => {
    const preferredStageFilter = getStageFilterValue(getStoredPreferredStageLevel());
    const hasMatchingStage = preferredStageFilter !== 'Tất cả' && currentExercises.some((exercise) => `Cấp ${exercise.stageLevel}` === preferredStageFilter);
    const nextStageFilter = hasMatchingStage ? preferredStageFilter : 'Tất cả';
    const scopedExercises =
      nextStageFilter === 'Tất cả'
        ? currentExercises
        : currentExercises.filter((exercise) => `Cấp ${exercise.stageLevel}` === nextStageFilter);
    const preferredExerciseId = getStoredPreferredExerciseId();
    const explicitPreferredExercise = scopedExercises.find((exercise) => exercise.id === preferredExerciseId);
    const preferredExercise = explicitPreferredExercise || getPreferredExercise(scopedExercises);

    setStageFilter(nextStageFilter);
    setSelectedExerciseId(preferredExercise?.id || '');
    setSubmissionCode(preferredExercise?.starterCode || '');
    setStoredPreferredExerciseId('');
  }, [selectedCourseId, currentExercises]);

  useEffect(() => {
    if (stageFilter === 'Tất cả') {
      setStoredPreferredStageLevel('');
      return;
    }

    const matchedLevel = stageFilter.match(/\d+/)?.[0] || '';
    setStoredPreferredStageLevel(matchedLevel);
  }, [stageFilter]);

  useEffect(() => {
    if (!selectedExerciseId) return;
    setStoredPreferredExerciseId(selectedExerciseId);
  }, [selectedExerciseId]);

  useEffect(() => {
    if (!filteredExercises.length) {
      setSelectedExerciseId('');
      setSubmissionCode('');
      return;
    }

    const selectedStillVisible = filteredExercises.some((exercise) => exercise.id === selectedExerciseId);
    if (!selectedStillVisible) {
      setSelectedExerciseId(filteredExercises[0].id);
      setSubmissionCode(filteredExercises[0].starterCode);
    }
  }, [filteredExercises, selectedExerciseId]);

  const selectedCourse = enrolledCourses.find((course) => course.id === selectedCourseId) || enrolledCourses[0];
  const selectedExercise =
    filteredExercises.find((exercise) => exercise.id === selectedExerciseId) || filteredExercises[0];

  // Lazily start the deadline clock the first time the user opens an exercise.
  useEffect(() => {
    if (!userKey || !selectedExercise) return;
    startExercise(userKey, selectedExercise);
  }, [userKey, selectedExercise]);

  const selectedProgress = useMemo(
    () => (selectedExercise ? getExerciseProgress(userKey, selectedExercise.id) : null),
    // progressTick forces recompute when localStorage changes or every minute.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userKey, selectedExercise, progressTick]
  );
  const selectedStatus = getDeadlineStatus(selectedProgress);

  const handleSelectExercise = (exercise) => {
    setSelectedExerciseId(exercise.id);
    setSubmissionCode(exercise.starterCode);
    if (userKey) {
      startExercise(userKey, exercise);
    }
  };

  const handleCompleteExercise = () => {
    if (!userKey || !selectedExercise) return;
    completeExercise(userKey, selectedExercise.id);
  };

  const handleReopenExercise = () => {
    if (!userKey || !selectedExercise) return;
    reopenExercise(userKey, selectedExercise.id);
  };

  const [simulateMessage, setSimulateMessage] = useState(null);
  const GRADING_KEY = 'training:gradingResult';

  const [showGradingModal, setShowGradingModal] = useState(() => {
    try {
      const saved = localStorage.getItem(GRADING_KEY);
      if (!saved) return false;
      const parsed = JSON.parse(saved);
      return parsed?.exerciseId === (getStoredPreferredExerciseId() || '') || false;
    } catch { return false; }
  });

  // Auto-show grading modal for completed exercises, or keep it for the correct exercise.
  useEffect(() => {
    if (!selectedExercise) return;
    const progress = getExerciseProgress(userKey, selectedExercise.id);
    if (progress?.completedAt) {
      setShowGradingModal(true);
      return;
    }
    // Not completed — only keep modal if localStorage says so for this exercise.
    try {
      const saved = localStorage.getItem(GRADING_KEY);
      if (!saved) { setShowGradingModal(false); return; }
      const parsed = JSON.parse(saved);
      if (parsed?.exerciseId !== selectedExercise.id) setShowGradingModal(false);
    } catch { setShowGradingModal(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExercise, userKey, progressTick]);

  const openGradingModal = () => {
    if (!selectedExercise) return;
    localStorage.setItem(GRADING_KEY, JSON.stringify({ exerciseId: selectedExercise.id }));
    setShowGradingModal(true);
  };

  const closeGradingModal = () => {
    localStorage.removeItem(GRADING_KEY);
    setShowGradingModal(false);
  };

  const handleSubmit = () => {
    if (!selectedExercise) return;
    if (userKey) completeExercise(userKey, selectedExercise.id);
    openGradingModal();
  };

  const handleSimulateOverdue = async () => {
    if (!userKey || !selectedExercise) return;
    simulateOverdueDeadline(userKey, selectedExercise.id);

    const updatedEntry = getExerciseProgress(userKey, selectedExercise.id);
    if (!updatedEntry || updatedEntry.completedAt || getDeadlineStatus(updatedEntry) !== 'overdue') return;

    const authUser = getStoredUser();
    const recipient = authUser?.email || authUser?.mssv || '(không có email)';
    const overdueLabel = formatRemaining(updatedEntry);

    // Try sending real email via backend first.
    try {
      const result = await sendOverdueEmailAPI({
        exerciseTitle: selectedExercise.title,
        courseName: selectedCourse?.name || '',
        overdueLabel,
        deadline: updatedEntry.deadline,
      });

      markOverdueNotified(userKey, selectedExercise.id);
      appendSimulatedEmail({
        id: `${selectedExercise.id}-${Date.now()}`,
        sentAt: new Date().toISOString(),
        to: result.to || recipient,
        subject: `Bạn đã trễ bài "${selectedExercise.title}"`,
        exerciseId: selectedExercise.id,
        exerciseTitle: selectedExercise.title,
        courseName: selectedCourse?.name || '',
        deadline: updatedEntry.deadline,
        overdueLabel,
        realEmail: true,
      });

      setSimulateMessage(`Đã gửi email thật đến ${result.to || recipient}`);
    } catch {
      // Backend unavailable – fall back to simulation.
      markOverdueNotified(userKey, selectedExercise.id);
      appendSimulatedEmail({
        id: `${selectedExercise.id}-${Date.now()}`,
        sentAt: new Date().toISOString(),
        to: recipient,
        subject: `Bạn đã trễ bài "${selectedExercise.title}"`,
        exerciseId: selectedExercise.id,
        exerciseTitle: selectedExercise.title,
        courseName: selectedCourse?.name || '',
        deadline: updatedEntry.deadline,
        overdueLabel,
        realEmail: false,
      });

      setSimulateMessage(`Đã giả lập gửi email nhắc trễ bài "${selectedExercise.title}" đến ${recipient} (BE chưa chạy)`);
    }

    window.setTimeout(() => setSimulateMessage(null), 6000);
  };

  return (
    <div className="space-y-6">
      {!enrolledCourses.length ? (
        <section className="glass-panel p-8">
          <div className="max-w-3xl">
            <div className="glass-chip">Chưa có môn được đăng ký</div>
            <h2 className="mt-4 text-3xl font-bold text-slate-900">
              Bạn cần đăng ký ít nhất một khóa học trước khi hệ thống mở bài tập tương ứng.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              Hãy vào mục <span className="font-semibold text-slate-900">Khóa học</span>, chọn môn muốn rèn luyện rồi đăng ký. Sau đó trang này mới hiển thị danh sách bài tập của môn đó.
            </p>
          </div>
        </section>
      ) : (
        <>
      <section className="glass-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="glass-chip">Bài tập theo khóa học</div>
            <h2 className="mt-4 text-3xl font-bold text-slate-900">{selectedCourse.name}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Chọn khóa học để xem các bài tập tương ứng rồi làm trực tiếp ngay trên dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {enrolledCourses.map((course) => (
              <button
                key={course.id}
                onClick={() => setSelectedCourseId(course.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  selectedCourseId === course.id
                    ? 'bg-primary-600 text-white shadow-[0_18px_35px_rgba(24,86,255,0.24)]'
                    : 'border border-white/55 bg-white/60 text-slate-700 hover:bg-white/80'
                }`}
              >
                {course.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="glass-panel p-5 xl:sticky xl:top-6 xl:self-start xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto no-scrollbar">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Danh sách bài</p>

          <div className="mt-5 space-y-3">
            {filteredExercises.map((exercise) => {
              const itemProgress = getExerciseProgress(userKey, exercise.id);
              const itemStatus = getDeadlineStatus(itemProgress);
              return (
                <button
                  key={exercise.id}
                  onClick={() => handleSelectExercise(exercise)}
                  className={`w-full rounded-3xl border p-4 text-left transition-all ${
                    selectedExercise?.id === exercise.id
                      ? 'border-primary-300 bg-white/80 shadow-[0_18px_35px_rgba(24,86,255,0.14)]'
                      : 'border-white/55 bg-white/50 hover:bg-white/70'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="glass-badge">Bài {exercise.order}</span>
                    <span className="glass-badge glass-badge-muted">{exercise.level}</span>
                    <span className="glass-badge glass-badge-muted">{exercise.status}</span>
                    {itemProgress ? (
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold ${deadlineBadgeClass(itemStatus)}`}
                      >
                        {deadlineBadgeLabel(itemStatus, itemProgress)}
                      </span>
                    ) : null}
                  </div>
                  <h4 className="mt-3 text-base font-bold text-slate-900">{exercise.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{exercise.objective}</p>
                </button>
              );
            })}
            {!filteredExercises.length ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white/45 p-5 text-sm leading-6 text-slate-600">
                Không có bài nào ở cấp hiện tại.
              </div>
            ) : null}
          </div>
        </aside>

        <div className="space-y-6">
          {selectedExercise ? (
            <section className="glass-panel p-6 relative">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span className="glass-badge">Bài {selectedExercise.order}</span>
                    <span className="glass-badge glass-badge-muted">{selectedExercise.level}</span>
                    <span className="glass-badge glass-badge-muted">{selectedExercise.difficulty}</span>
                    <span className="glass-badge glass-badge-muted">{selectedExercise.expectedScore}</span>
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-slate-900">{selectedExercise.title}</h2>
                </div>
                <button className="glass-button flex-shrink-0" onClick={handleSubmit}>Nộp bài</button>
              </div>

              <div className="mt-5 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-5">
                  <div className="glass-subpanel">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Hạn nộp bài</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          Bài này có thời gian làm <strong>{getDurationDays(selectedExercise)} ngày</strong> tính từ lần đầu bạn mở.
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${deadlineBadgeClass(selectedStatus)}`}
                      >
                        {deadlineBadgeLabel(selectedStatus, selectedProgress)}
                      </span>
                    </div>

                    {selectedProgress ? (
                      <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                        <div>
                          <span className="font-semibold text-slate-500">Bắt đầu: </span>
                          {formatDateTime(selectedProgress.startedAt)}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500">Hết hạn: </span>
                          {formatDateTime(selectedProgress.deadline)}
                        </div>
                        {selectedProgress.completedAt ? (
                          <div className="sm:col-span-2">
                            <span className="font-semibold text-slate-500">Hoàn thành: </span>
                            {formatDateTime(selectedProgress.completedAt)}
                          </div>
                        ) : null}
                        {selectedProgress.overdueNotifiedAt ? (
                          <div className="sm:col-span-2 text-rose-600">
                            <span className="font-semibold">Đã gửi mail nhắc trễ: </span>
                            {formatDateTime(selectedProgress.overdueNotifiedAt)}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedStatus !== 'completed' ? (
                        <button
                          type="button"
                          onClick={handleCompleteExercise}
                          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700"
                        >
                          Đánh dấu hoàn thành
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleReopenExercise}
                          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Mở lại bài
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleSimulateOverdue}
                        className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                        title="Chỉ dùng để demo: đẩy deadline về quá khứ để thấy email nhắc trễ"
                      >
                        Test: giả lập trễ deadline
                      </button>
                    </div>

                    {simulateMessage ? (
                      <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm font-medium text-amber-800 shadow-sm">
                        📧 {simulateMessage}
                        <span className="ml-2 text-xs text-amber-600">(xem chi tiết ở trang Hồ sơ)</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="glass-subpanel">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Đề bài</p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">{selectedExercise.prompt}</p>
                  </div>

                  <div className="glass-subpanel">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Kỹ năng cần luyện</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedExercise.suggestedSkills.map((skill) => (
                        <span key={skill} className="glass-chip text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="glass-subpanel">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Bộ test tham chiếu</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      {selectedExercise.testCases.map((testCase) => (
                        <li key={testCase} className="flex items-start gap-2">
                          <span className="mt-2 h-2 w-2 rounded-full bg-primary-500" />
                          <span>{testCase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="glass-subpanel">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Khu vực làm bài</p>
                  <textarea
                    value={submissionCode}
                    onChange={(event) => setSubmissionCode(event.target.value)}
                    spellCheck={false}
                    className="mt-5 h-[420px] w-full rounded-3xl border border-slate-200/70 bg-slate-950 px-5 py-4 font-mono text-sm leading-7 text-slate-100 outline-none"
                  />
                </div>
              </div>

              {showGradingModal ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[28px] bg-slate-900/50 backdrop-blur-sm">
                  <div className="mx-4 w-full max-w-lg rounded-3xl border border-white/30 bg-white/95 p-6 shadow-2xl backdrop-blur-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Kết quả chấm</p>
                            <h3 className="mt-1 text-lg font-bold text-slate-900">Phản hồi sau khi nộp bài</h3>
                          </div>
                          <span className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                            {assessmentPreview.status}
                          </span>
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-center">
                          <p className="text-xs font-semibold text-slate-500">Điểm hiện tại</p>
                          <p className="mt-1 text-4xl font-bold text-primary-700">{assessmentPreview.score}</p>
                          <p className="mt-2 text-xs leading-5 text-slate-600">{assessmentPreview.message}</p>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-slate-100 bg-white p-3">
                            <p className="text-xs font-semibold text-slate-900">Lỗi cần cải thiện</p>
                            <ul className="mt-2 space-y-1">
                              {assessmentPreview.weakAreas.map((item) => (
                                <li key={item} className="flex items-start gap-1.5 text-xs leading-5 text-slate-600">
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-danger-500" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-2xl border border-slate-100 bg-white p-3">
                            <p className="text-xs font-semibold text-slate-900">Điểm mạnh</p>
                            <ul className="mt-2 space-y-1">
                              {assessmentPreview.strengths.map((item) => (
                                <li key={item} className="flex items-start gap-1.5 text-xs leading-5 text-slate-600">
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success-500" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-primary-100 bg-primary-50/80 px-4 py-3 text-xs font-medium leading-5 text-primary-800">
                          Gợi ý tiếp theo: {assessmentPreview.nextAction}
                        </div>

                    <button
                      type="button"
                      onClick={closeGradingModal}
                      className="mt-4 w-full rounded-full bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-primary-700 transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

        </div>
      </section>
        </>
      )}
    </div>
  );
};

export default Exercises;
