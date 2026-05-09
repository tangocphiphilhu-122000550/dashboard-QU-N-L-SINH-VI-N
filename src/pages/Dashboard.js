import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ENROLLED_COURSES_KEY,
  TRAINING_COURSE_KEY,
  courseCatalog,
  courseExerciseCatalog,
  studentMock,
  friendSuggestions,
} from '../data/trainingMockData';
import {
  applyEffectiveStatuses,
  resolveUserKey,
  subscribeProgressChange,
} from '../exerciseProgress';
import { getStoredUser } from '../auth';

const toneClasses = {
  primary: 'from-primary-500/20 via-primary-400/10 to-white/20 text-primary-700',
  info: 'from-sky-400/20 via-cyan-300/10 to-white/20 text-sky-700',
  success: 'from-success-500/20 via-emerald-300/10 to-white/20 text-emerald-700',
  warning: 'from-warning-500/20 via-amber-300/10 to-white/20 text-amber-700',
};

const Dashboard = ({ setCurrentPage }) => {
  const [enrolledCourseIds] = useState(() => {
    const saved = localStorage.getItem(ENROLLED_COURSES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [friendRequests, setFriendRequests] = useState(() => {
    const saved = localStorage.getItem('friendRequests');
    return saved ? JSON.parse(saved) : [];
  });

  const handleFriendRequest = (friendId) => {
    const newRequests = friendRequests.includes(friendId)
      ? friendRequests.filter((id) => id !== friendId)
      : [...friendRequests, friendId];
    
    setFriendRequests(newRequests);
    localStorage.setItem('friendRequests', JSON.stringify(newRequests));
  };

  const enrolledCourses = useMemo(
    () => courseCatalog.filter((course) => enrolledCourseIds.includes(course.id)),
    [enrolledCourseIds]
  );

  const [selectedCourseId] = useState(() => {
    const savedCourseId = localStorage.getItem(TRAINING_COURSE_KEY);
    if (savedCourseId && enrolledCourseIds.includes(savedCourseId)) return savedCourseId;
    return enrolledCourseIds[0] || '';
  });

  const selectedCourse = useMemo(
    () => enrolledCourses.find((course) => course.id === selectedCourseId) || enrolledCourses[0],
    [selectedCourseId, enrolledCourses]
  );

  const userKey = useMemo(() => resolveUserKey(getStoredUser()), []);
  const [progressTick, setProgressTick] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeProgressChange(() => setProgressTick((value) => value + 1));
    return unsubscribe;
  }, []);

  const currentExercises = useMemo(() => {
    const base = selectedCourse ? courseExerciseCatalog[selectedCourse.id] || [] : [];
    return applyEffectiveStatuses(userKey, base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse, userKey, progressTick]);
  const recommendedExercises =
    currentExercises.filter((exercise) => exercise.status === 'Đang mở' || exercise.status === 'Sắp mở').slice(0, 2) ||
    [];
  const unlockedCount = currentExercises.filter((exercise) => exercise.status !== 'Khóa').length;
  const completedCount = currentExercises.filter((exercise) => exercise.status === 'Đã làm').length;
  const activeCount = currentExercises.filter((exercise) => exercise.status === 'Đang mở').length;
  const upcomingCount = currentExercises.filter((exercise) => exercise.status === 'Sắp mở').length;
  const lockedCount = currentExercises.filter((exercise) => exercise.status === 'Khóa').length;
  const nextExercise =
    currentExercises.find((exercise) => exercise.status === 'Đang mở') ||
    currentExercises.find((exercise) => exercise.status === 'Sắp mở') ||
    currentExercises[0];

  const exerciseStatusChartData = [
    { label: 'Đã làm', count: completedCount, color: '#16a34a', description: 'Các bài đã hoàn thành' },
    { label: 'Đang mở', count: activeCount, color: '#1856FF', description: 'Các bài có thể làm ngay' },
    { label: 'Sắp mở', count: upcomingCount, color: '#f59e0b', description: 'Các bài sẽ mở tiếp theo' },
    { label: 'Khóa', count: lockedCount, color: '#94a3b8', description: 'Các bài chưa mở' },
  ];

  const overviewMetrics = [
    {
      id: 'level',
      title: 'Cấp độ hiện tại',
      value: selectedCourse ? `Lv ${selectedCourse.currentLevel}` : '--',
      subtitle: selectedCourse ? selectedCourse.name : 'Chưa đăng ký môn',
      tone: 'primary',
    },
    {
      id: 'progress',
      title: 'Tiến độ khóa học',
      value: selectedCourse ? `${selectedCourse.progressPercent}%` : '--',
      subtitle: selectedCourse
        ? `Đã mở ${unlockedCount}/${selectedCourse.totalExercises} bài`
        : 'Đăng ký môn để bắt đầu',
      tone: 'info',
    },
    {
      id: 'streak',
      title: 'Chuỗi luyện tập',
      value: `${studentMock.weeklyStreak} ngày`,
      subtitle: 'Giữ nhịp đều trong tuần này',
      tone: 'success',
    },
    {
      id: 'focus',
      title: 'Kỹ năng trọng tâm',
      value: selectedCourse ? selectedCourse.focus[0] : 'Chưa có',
      subtitle: selectedCourse ? selectedCourse.focus.slice(1).join(' • ') : 'Chọn môn để theo dõi',
      tone: 'warning',
    },
  ];

  const todayPlan = [
    {
      id: 'plan-1',
      title: 'Hôm nay bạn nên làm bài nào',
      headline: recommendedExercises[0]?.title || (selectedCourse ? `Làm bài đầu tiên của ${selectedCourse.name}` : 'Đăng ký môn đầu tiên'),
      detail:
        recommendedExercises[0]?.objective ||
        (selectedCourse
          ? `Bắt đầu nhánh ${selectedCourse.name} để mở lộ trình luyện tập theo đúng môn đã chọn.`
          : 'Hãy vào mục Khóa học và đăng ký môn muốn rèn luyện trước.'),
      cta: 'Mở bài thực hành',
    },
    {
      id: 'plan-2',
      title: 'Bạn đang yếu ở đâu',
      headline: selectedCourse ? selectedCourse.focus[0] : 'Chưa có dữ liệu',
      detail: selectedCourse
        ? `Đây là nhóm kỹ năng cần ưu tiên củng cố trước trong môn ${selectedCourse.name}.`
        : 'Sau khi đăng ký môn và làm bài, hệ thống sẽ phân tích điểm yếu tại đây.',
      cta: 'Xem lỗi & phản hồi',
    },
    {
      id: 'plan-3',
      title: 'Sau bài này nên chuyển sang mức nào',
      headline: selectedCourse
        ? `Lv ${selectedCourse.currentLevel + 1} - ${selectedCourse.focus[selectedCourse.focus.length - 1]}`
        : 'Chọn môn để mở lộ trình',
      detail: selectedCourse
        ? `Nếu hoàn thành tốt bài hiện tại, bạn có thể mở tiếp nhánh khó hơn của ${selectedCourse.name}.`
        : 'Lộ trình nâng dần độ khó sẽ xuất hiện sau khi bạn đăng ký môn.',
      cta: 'Xem khóa học',
    },
  ];

  return (
    <div className="space-y-6">
      {!selectedCourse ? (
        <section className="glass-panel overflow-hidden p-8">
          <div className="max-w-3xl">
            <div className="glass-chip">Chưa có môn được đăng ký</div>
            <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
              Bạn cần đăng ký một khóa học trước khi dashboard mở tiến độ, gợi ý bài tập và lộ trình rèn luyện.
            </h2>
            <div className="mt-6">
              <button className="glass-button" onClick={() => setCurrentPage('courses')}>
                Đi đến Khóa học
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {selectedCourse ? (
        <>
          <section className="glass-panel overflow-hidden p-6 sm:p-8">
            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div>
                <div className="glass-chip">Tổng quan luyện tập</div>
                <h2 className="mt-4 max-w-3xl text-3xl font-bold text-slate-900 sm:text-4xl">
                  Theo dõi tiến độ của {selectedCourse.name}, chọn đúng bài nên làm và nhìn rõ bước tiếp theo trong quá trình rèn luyện.
                </h2>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="glass-button" onClick={() => setCurrentPage('exercises')}>
                    Làm bài ngay
                  </button>
                  <button className="glass-button-secondary" onClick={() => setCurrentPage('courses')}>
                    Chọn khóa học
                  </button>
                </div>
              </div>

              <div className="glass-subpanel flex flex-col justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Trọng tâm hôm nay</p>
                  <h3 className="mt-3 text-xl font-bold text-slate-900">
                    Củng cố {selectedCourse.focus[0].toLowerCase()} trước khi mở nhánh tiếp theo của {selectedCourse.name}.
                  </h3>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl border border-white/60 bg-white/55 p-4">
                    <p className="text-sm font-semibold text-slate-900">Độ phù hợp bài gợi ý</p>
                    <p className="mt-1 text-3xl font-bold text-primary-700">
                      {recommendedExercises[0]?.masteryFit || '88%'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/55 p-4">
                    <p className="text-sm font-semibold text-slate-900">Khả năng mở cấp tiếp theo</p>
                    <p className="mt-1 text-3xl font-bold text-emerald-600">
                      {selectedCourse.progressPercent >= 50 ? 'Cao' : 'Đang tăng'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {overviewMetrics.map((metric) => (
              <article
                key={metric.id}
                className={`glass-panel bg-gradient-to-br p-5 ${toneClasses[metric.tone] || toneClasses.primary}`}
              >
                <p className="text-sm font-semibold text-slate-600">{metric.title}</p>
                <p className="mt-4 text-3xl font-bold text-slate-900">{metric.value}</p>
                <p className="mt-2 text-sm text-slate-600">{metric.subtitle}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Tiến độ bài tập</p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">Môn {selectedCourse.name} đang học tới đâu</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Biểu đồ này cho biết môn hiện tại có bao nhiêu bài đã làm, bao nhiêu bài đang mở, sắp mở và còn khóa.
                  </p>
                </div>
                <div className="glass-badge">{completedCount}/{currentExercises.length} bài đã làm</div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
                <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-4 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#16a34a]" />
                  <span>Đã làm</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-4 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#1856FF]" />
                  <span>Đang mở</span>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-4 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
                  <span>Sắp mở</span>
                </div>
                <div className="rounded-full border border-white/60 bg-white/55 px-4 py-2">
                  Trục dọc: số lượng bài
                </div>
              </div>

              <div className="mt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={exerciseStatusChartData} barCategoryGap={28}>
                    <CartesianGrid stroke="rgba(148, 163, 184, 0.18)" vertical={false} />
                    <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} stroke="#64748b" tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value) => [`${value} bài`, 'Số lượng']}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return item ? `${label}: ${item.description}` : label;
                      }}
                      contentStyle={{
                        borderRadius: 20,
                        border: '1px solid rgba(255,255,255,0.6)',
                        background: 'rgba(255,255,255,0.88)',
                        backdropFilter: 'blur(18px)',
                        boxShadow: '0 18px 45px rgba(15,23,42,0.12)',
                      }}
                    />
                    <Bar dataKey="count" radius={[12, 12, 0, 0]}>
                      {exerciseStatusChartData.map((entry) => (
                        <Cell key={entry.label} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/60 bg-white/55 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Bài đã xong</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{completedCount} bài</p>
                  <p className="mt-1 text-sm text-slate-600">Đã hoàn thành trong tổng số {currentExercises.length} bài của môn này</p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/55 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Có thể làm ngay</p>
                  <p className="mt-2 text-2xl font-bold text-primary-700">{activeCount + upcomingCount} bài</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {activeCount ? 'Đang có bài mở sẵn để bạn bắt đầu.' : 'Hiện chưa có bài mở ngay, hãy xem bậc tiếp theo.'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/60 bg-white/55 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Bài nên làm tiếp</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{nextExercise?.title || 'Chưa có gợi ý'}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {nextExercise ? `${nextExercise.level} • ${nextExercise.status}` : 'Đăng ký môn để hệ thống gợi ý bài tiếp theo'}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Bài nên làm hôm nay</p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">Gợi ý bài tập của {selectedCourse.name}</h3>
                </div>
                <button className="text-sm font-semibold text-primary-700" onClick={() => setCurrentPage('exercises')}>
                  Xem tất cả
                </button>
              </div>

              <div className="mt-5 space-y-4">
                {recommendedExercises.slice(0, 2).map((exercise) => {
                  const exerciseTags = Array.isArray(exercise.skillTags)
                    ? exercise.skillTags
                    : Array.isArray(exercise.suggestedSkills)
                      ? exercise.suggestedSkills
                      : [];

                  return (
                    <article key={exercise.id} className="glass-subpanel">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="glass-badge">{exercise.level}</span>
                        <span className="glass-badge glass-badge-muted">{exercise.difficulty}</span>
                        <span className="glass-badge glass-badge-muted">{exercise.estimatedTime}</span>
                      </div>
                      <h4 className="mt-4 text-lg font-bold text-slate-900">{exercise.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{exercise.reason}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {exerciseTags.map((tag) => (
                          <span key={tag} className="glass-chip text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            {todayPlan.map((item) => (
              <article key={item.id} className="glass-panel p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{item.title}</p>
                <h3 className="mt-4 text-xl font-bold text-slate-900">{item.headline}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
                <button
                  className="mt-6 text-sm font-semibold text-primary-700"
                  onClick={() => {
                    if (item.id === 'plan-1') setCurrentPage('exercises');
                    if (item.id === 'plan-2') setCurrentPage('feedback');
                    if (item.id === 'plan-3') setCurrentPage('courses');
                  }}
                >
                  {item.cta}
                </button>
              </article>
            ))}
          </section>

          <section className="glass-panel p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="glass-chip">Gợi ý kết bạn theo năng lực</div>
                <h3 className="mt-4 text-2xl font-bold text-slate-900">Sinh viên có kỹ năng tương đồng</h3>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {friendSuggestions.map((friend) => (
                <article
                  key={friend.id}
                  className="group relative overflow-hidden rounded-[28px] border border-white/55 bg-white/55 p-5 transition-all hover:-translate-y-1 hover:border-primary-200 hover:bg-white/75 hover:shadow-[0_18px_35px_rgba(24,86,255,0.12)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-400 text-2xl shadow-[0_12px_28px_rgba(24,86,255,0.25)]">
                      {friend.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-base font-bold text-slate-900">{friend.name}</h4>
                      <p className="text-xs text-slate-500">{friend.studentId}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <span>🔥 {friend.weeklyStreak} ngày</span>
                        <span>•</span>
                        <span>✓ {friend.solvedCount} bài</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-500">Độ khớp</span>
                      <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
                        {friend.matchScore}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-500">Điểm mạnh</span>
                      <span className="truncate text-xs font-semibold text-emerald-700">{friend.strengthArea}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {friend.commonCourses.slice(0, 3).map((course) => (
                      <span key={course} className="glass-chip text-[10px]">
                        {course}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFriendRequest(friend.id)}
                    className={`mt-4 w-full rounded-full py-2 text-sm font-semibold transition-all ${
                      friendRequests.includes(friend.id)
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {friendRequests.includes(friend.id) ? '✓ Đã gửi lời mời' : 'Kết bạn'}
                  </button>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
};

export default Dashboard;
