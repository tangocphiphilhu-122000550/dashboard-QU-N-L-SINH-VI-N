import React, { useEffect, useMemo, useState } from 'react';
import { ENROLLED_COURSES_KEY, TRAINING_COURSE_KEY, courseCatalog, courseRoadmaps } from '../data/trainingMockData';
import {
  getStoredEnrolledCourseIds,
  getStoredSelectedCourseId,
  setStoredEnrolledCourseIds,
  setStoredPreferredStageLevel,
  setStoredSelectedCourseId,
  subscribeTrainingSelection,
} from '../trainingSelection';

const roadmapStatusMap = {
  done: {
    label: 'Đã vượt cấp',
    badgeClass: 'bg-emerald-100/85 text-emerald-700',
    nodeClass: 'from-emerald-500 to-teal-400 shadow-[0_18px_35px_rgba(16,185,129,0.28)]',
    panelClass: 'border-emerald-100/80 bg-[linear-gradient(135deg,rgba(236,253,245,0.92),rgba(255,255,255,0.76))]',
    branchClass: 'border-emerald-100/75 bg-[linear-gradient(135deg,rgba(240,253,244,0.86),rgba(255,255,255,0.68))]',
    branchLead: 'Cấp này đã vượt qua bài kiểm tra, nên nhánh bù chỉ còn để tham khảo lại khi cần ôn.',
  },
  active: {
    label: 'Đang luyện',
    badgeClass: 'bg-blue-100/85 text-blue-700',
    nodeClass: 'from-primary-500 to-cyan-400 shadow-[0_18px_35px_rgba(24,86,255,0.3)]',
    panelClass: 'border-primary-100/80 bg-[linear-gradient(135deg,rgba(239,244,255,0.96),rgba(255,255,255,0.78))]',
    branchClass: 'border-sky-100/75 bg-[linear-gradient(135deg,rgba(240,249,255,0.88),rgba(255,255,255,0.68))]',
    branchLead: 'Nếu bài kiểm tra cuối cấp chưa đạt, hệ thống sẽ gọi API ngân hàng đề để đẩy thêm bài bù theo đúng kỹ năng còn yếu.',
  },
  next: {
    label: 'Sắp mở',
    badgeClass: 'bg-amber-100/85 text-amber-700',
    nodeClass: 'from-warning-500 to-amber-300 shadow-[0_18px_35px_rgba(232,149,88,0.24)]',
    panelClass: 'border-amber-100/80 bg-[linear-gradient(135deg,rgba(255,247,237,0.94),rgba(255,255,255,0.76))]',
    branchClass: 'border-amber-100/75 bg-[linear-gradient(135deg,rgba(255,251,235,0.88),rgba(255,255,255,0.68))]',
    branchLead: 'Nhánh này sẽ chỉ được tính tới sau khi bạn mở được bài kiểm tra của cấp hiện tại.',
  },
  locked: {
    label: 'Đang khóa',
    badgeClass: 'bg-slate-200/90 text-slate-600',
    nodeClass: 'from-slate-300 to-slate-200 shadow-[0_18px_35px_rgba(148,163,184,0.16)]',
    panelClass: 'border-slate-200/80 bg-[linear-gradient(135deg,rgba(248,250,252,0.96),rgba(255,255,255,0.76))]',
    branchClass: 'border-slate-200/75 bg-[linear-gradient(135deg,rgba(248,250,252,0.88),rgba(255,255,255,0.68))]',
    branchLead: 'Cấp này còn khóa nên chưa gọi bài bù. Hệ thống chỉ mở sau khi các cấp trước đó hoàn thành.',
  },
};

const difficultyLabel = {
  Beginner: 'Cơ bản',
  Intermediate: 'Trung bình',
  Advanced: 'Nâng cao',
};

const countAdaptiveExercises = (roadmap) =>
  roadmap.reduce((sum, stage) => sum + (stage.remediation?.exercises?.length || 0), 0);

const Courses = ({ setCurrentPage }) => {
  const [selectedCourseId, setSelectedCourseId] = useState(() => localStorage.getItem(TRAINING_COURSE_KEY) || courseCatalog[0].id);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(() => {
    const saved = localStorage.getItem(ENROLLED_COURSES_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => {
    setStoredSelectedCourseId(selectedCourseId);
  }, [selectedCourseId]);

  useEffect(
    () =>
      subscribeTrainingSelection(() => {
        const nextSelectedCourseId = getStoredSelectedCourseId() || courseCatalog[0].id;
        const nextEnrolledCourseIds = getStoredEnrolledCourseIds();

        setSelectedCourseId(nextSelectedCourseId);
        setEnrolledCourseIds((current) =>
          JSON.stringify(current) === JSON.stringify(nextEnrolledCourseIds) ? current : nextEnrolledCourseIds
        );
      }),
    []
  );

  const selectedCourse = useMemo(
    () => courseCatalog.find((course) => course.id === selectedCourseId) || courseCatalog[0],
    [selectedCourseId]
  );

  const selectedRoadmap = useMemo(() => courseRoadmaps[selectedCourse.id] || [], [selectedCourse.id]);
  const isEnrolled = enrolledCourseIds.includes(selectedCourse.id);
  const enrolledCourses = useMemo(
    () => courseCatalog.filter((course) => enrolledCourseIds.includes(course.id)),
    [enrolledCourseIds]
  );

  const currentStage = useMemo(
    () => selectedRoadmap.find((stage) => stage.status === 'active') || selectedRoadmap.find((stage) => stage.status === 'next') || selectedRoadmap[0],
    [selectedRoadmap]
  );

  const roadmapStats = useMemo(() => {
    const practiceCount = selectedRoadmap.reduce((sum, stage) => sum + stage.exercises.length, 0);
    const completedPracticeCount = selectedRoadmap.reduce((sum, stage) => sum + (stage.completedPracticeCount || 0), 0);

    return {
      practiceCount,
      completedPracticeCount,
      assessmentCount: selectedRoadmap.length,
      adaptiveCount: countAdaptiveExercises(selectedRoadmap),
    };
  }, [selectedRoadmap]);

  const handleEnroll = (courseId) => {
    console.log('🔵 handleEnroll called with courseId:', courseId);
    console.log('🔵 Current enrolledCourseIds:', enrolledCourseIds);
    
    setEnrolledCourseIds((current) => {
      if (current.includes(courseId)) {
        console.log('⚠️ Already enrolled, skipping');
        return current;
      }
      const newIds = [...current, courseId];
      console.log('✅ New enrolledCourseIds:', newIds);
      // Save to localStorage immediately
      setStoredEnrolledCourseIds(newIds);
      return newIds;
    });
    setSelectedCourseId(courseId);
    setStoredSelectedCourseId(courseId);
  };

  const handleOpenStageExercises = (stageLevel) => {
    setSelectedCourseId(selectedCourse.id);
    setStoredSelectedCourseId(selectedCourse.id);
    setStoredPreferredStageLevel(stageLevel);
    if (typeof setCurrentPage === 'function') {
      setCurrentPage('exercises');
    }
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 sm:p-8">
        <div className="max-w-4xl">
          <div className="glass-chip">Chọn môn muốn rèn luyện</div>
          <h2 className="mt-4 text-3xl font-bold text-slate-900">
            Đăng ký môn trước, sau đó hệ thống mới mở từng cấp bài tập, bài kiểm tra và nhánh bù tương ứng.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            Mỗi môn có nhiều cấp từ dễ đến khó. Mỗi cấp gồm nhiều bài luyện, một bài kiểm tra lên cấp và một nhánh bổ sung bài tập nếu bạn còn yếu ở kỹ năng nào đó.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {courseCatalog.map((course) => {
            const courseEnrolled = enrolledCourseIds.includes(course.id);

            return (
              <article
                key={course.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedCourseId(course.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedCourseId(course.id);
                  }
                }}
                className={`flex h-full flex-col rounded-[28px] border p-5 text-left transition-all ${
                  selectedCourseId === course.id
                    ? 'cursor-pointer border-primary-300 bg-white/85 shadow-[0_18px_35px_rgba(24,86,255,0.14)]'
                    : 'cursor-pointer border-white/55 bg-white/55 hover:bg-white/75'
                }`}
              >
                <div className="flex flex-1 flex-col text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-3xl">{course.thumbnail}</div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {difficultyLabel[course.difficulty] || course.difficulty}
                    </span>
                  </div>

                  <div className="mt-4 flex min-h-[154px] flex-col">
                    <h3 className="text-lg font-bold text-slate-900">{course.name}</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {course.code} • {course.credits} tín chỉ
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{course.subtitle}</p>
                  </div>
                </div>

                <div className="mt-5 border-t border-slate-200/70 pt-4">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {course.focus.map((skill) => (
                      <span key={skill} className="glass-chip text-[11px]">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-500">{courseEnrolled ? 'Đã đăng ký' : 'Chưa đăng ký'}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleEnroll(course.id);
                      }}
                      disabled={courseEnrolled}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                        courseEnrolled
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {courseEnrolled ? 'Đã chọn' : 'Đăng ký'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Lộ trình bài tập</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">
                {isEnrolled ? 'Mỗi cấp có nhiều bài luyện, 1 bài test và nhánh bù thích ứng' : 'Đăng ký môn để mở lộ trình'}
              </h3>
            </div>
            <div className="glass-badge">{isEnrolled ? 'Mở theo tiến độ' : 'Chưa mở'}</div>
          </div>

          {isEnrolled ? (
            <div className="relative mt-8 space-y-5">
              <div className="absolute bottom-0 left-[2.35rem] top-0 w-px bg-gradient-to-b from-primary-200/15 via-cyan-300/55 to-slate-200/10" />

              {selectedRoadmap.map((stage) => {
                const status = roadmapStatusMap[stage.status];
                const remediationTitle = stage.remediation.exercises[0] || 'Bài bù thích ứng';
                const isCurrentStage = stage.status === 'active';

                return (
                  <article key={stage.id} className="group relative grid gap-4 pl-20 md:pl-24">
                    <div className="absolute left-0 top-6 flex flex-col items-center">
                      <div
                        className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-[24px] border border-white/80 bg-gradient-to-br transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-[1.03] ${status.nodeClass}`}
                      >
                        {isCurrentStage ? (
                          <span className="absolute inset-0 rounded-[24px] border border-white/35 animate-pulse" aria-hidden="true" />
                        ) : null}
                        <span className="relative text-lg font-bold text-white">L{stage.level}</span>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpenStageExercises(stage.level)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleOpenStageExercises(stage.level);
                          }
                        }}
                        className={`glass-subpanel relative overflow-hidden border ${status.panelClass} transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_28px_70px_rgba(148,163,184,0.18)]`}
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-slate-900/6 px-3 py-1 text-xs font-semibold text-slate-600">Cấp {stage.level}</span>
                          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">{stage.tier}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.badgeClass}`}>{status.label}</span>
                        </div>

                        <h4 className="mt-4 text-2xl font-bold leading-tight text-slate-900">{stage.title}</h4>
                      </div>

                      <aside
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpenStageExercises(stage.level)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleOpenStageExercises(stage.level);
                          }
                        }}
                        className={`relative overflow-hidden rounded-[28px] border p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.74)] backdrop-blur-xl transition-all duration-300 group-hover:translate-x-1 group-hover:shadow-[0_24px_60px_rgba(148,163,184,0.16)] ${status.branchClass}`}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{stage.remediation.title}</p>
                        <h5 className="mt-4 text-2xl font-bold leading-tight text-slate-900">{remediationTitle}</h5>
                      </aside>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-[28px] border border-dashed border-slate-300 bg-white/45 p-6 text-sm leading-7 text-slate-600">
              Bạn cần đăng ký môn <span className="font-semibold text-slate-900">{selectedCourse.name}</span> trước thì hệ thống mới mở lộ trình bài tập, bài kiểm tra và nhánh bù cho môn này.
            </div>
          )}
        </div>

        <div className="glass-panel p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Tổng quan môn đã chọn</p>
          <div className="mt-5 space-y-4">
            {isEnrolled ? (
              <>
                <div className="glass-subpanel">
                  <p className="text-sm text-slate-500">Môn đang rèn luyện</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{selectedCourse.name}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedCourse.code} • {selectedCourse.credits} tín chỉ
                  </p>
                </div>

                <div className="glass-subpanel">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Tiến độ tổng</span>
                    <span>{selectedCourse.progressPercent}%</span>
                  </div>
                  <div className="mt-3 h-3 rounded-full bg-slate-200/70">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-cyan-400"
                      style={{ width: `${selectedCourse.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="glass-subpanel">
                    <p className="text-sm text-slate-500">Cấp đang xử lý</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">Cấp {currentStage?.level || '--'}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{currentStage?.title || 'Chưa có dữ liệu cấp học'}</p>
                  </div>
                  <div className="glass-subpanel">
                    <p className="text-sm text-slate-500">Bài trong cấp hiện tại</p>
                    <p className="mt-2 text-xl font-bold text-slate-900">
                      {currentStage ? `${currentStage.completedPracticeCount}/${currentStage.exercises.length}` : '--'}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Hoàn thành hết các bài luyện rồi hệ thống mới mở bài test lên cấp.</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="glass-subpanel">
                    <p className="text-sm text-slate-500">Bài luyện chính</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{roadmapStats.practiceCount}</p>
                  </div>
                  <div className="glass-subpanel">
                    <p className="text-sm text-slate-500">Bài kiểm tra cấp</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{roadmapStats.assessmentCount}</p>
                  </div>
                  <div className="glass-subpanel">
                    <p className="text-sm text-slate-500">Bài bù thích ứng</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{roadmapStats.adaptiveCount}</p>
                  </div>
                </div>

                <div className="glass-subpanel">
                  <p className="text-sm text-slate-500">Nhóm kỹ năng chính</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedCourse.focus.map((skill) => (
                      <span key={skill} className="glass-chip text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-subpanel">
                <p className="text-sm text-slate-500">Trạng thái môn đang xem</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">Chưa đăng ký</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Môn <span className="font-semibold text-slate-900">{selectedCourse.name}</span> mới chỉ đang được xem trước. Sau khi đăng ký, phần này mới hiển thị cấp đang mở, số bài luyện, bài kiểm tra và nhánh bù thích ứng.
                </p>
              </div>
            )}

            <div className="glass-subpanel">
              <p className="text-sm text-slate-500">Môn đã đăng ký</p>
              {enrolledCourses.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {enrolledCourses.map((course) => (
                    <span key={course.id} className="glass-chip text-xs">
                      {course.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-7 text-slate-600">Hiện chưa có môn nào được đăng ký để rèn luyện.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Courses;
