import React from 'react';
import { feedbackHistory, feedbackSummary } from '../data/trainingMockData';

const severityStyle = {
  Cao: 'bg-danger-100 text-danger-700',
  'Trung bình': 'bg-warning-100 text-warning-700',
  Thấp: 'bg-emerald-100 text-emerald-700',
};

const Feedback = () => {
  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="glass-chip">Lỗi gặp trong quá trình luyện code</div>
            <h2 className="mt-4 text-3xl font-bold text-slate-900">Nhật ký lỗi và hướng cải thiện</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Mỗi khi làm bài tập, các lỗi quan trọng sẽ được lưu lại để bạn xem lại, biết mình sai ở đâu và cải thiện theo từng nhóm lỗi.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {feedbackSummary.map((item) => (
          <article key={item.id} className="glass-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityStyle[item.severity] || severityStyle.Thấp}`}>
                {item.severity}
              </span>
            </div>
            <p className="mt-4 text-4xl font-bold text-primary-700">{item.count}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.recommendation}</p>
          </article>
        ))}
      </section>

      <section className="glass-panel p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Lỗi gần đây</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">Xem lại lỗi đã gặp và cách sửa</h3>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {feedbackHistory.map((item) => (
            <article key={item.id} className="glass-subpanel">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-lg font-bold text-slate-900">{item.exercise}</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.course} • {item.where}
                  </p>
                </div>
                <div className="glass-badge">{item.lastSeen}</div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Lỗi gặp phải</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{item.errorType}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
                </div>
                <div className="lg:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cách cải thiện</p>
                  <p className="mt-2 text-sm leading-7 text-slate-700">{item.improvement}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Feedback;
