import React from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import { softSkillCards, softSkillEvidence, softSkillRadar } from '../data/trainingMockData';

const Skills = () => {
  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="glass-chip">Kỹ năng tích lũy qua quá trình luyện code</div>
            <h2 className="mt-4 text-3xl font-bold text-slate-900">
              Không chỉ học code, bạn còn đang tích lũy kỹ năng mềm qua cách giải bài, sửa lỗi và phối hợp làm việc.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              Trang này giúp bạn nhìn thấy mình tiến bộ ở những kỹ năng nào thông qua quá trình rèn luyện hằng ngày.
            </p>
          </div>

          <div className="glass-subpanel">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Bản đồ kỹ năng mềm</p>
            <div className="mt-4 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={softSkillRadar}>
                  <PolarGrid stroke="rgba(148,163,184,0.25)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} tick={false} axisLine={false} />
                  <Radar
                    name="Kỹ năng mềm"
                    dataKey="value"
                    stroke="#1856FF"
                    fill="#1856FF"
                    fillOpacity={0.28}
                    strokeWidth={2.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {softSkillCards.map((item) => (
          <article key={item.id} className="glass-panel p-5">
            <p className="text-sm font-semibold text-slate-500">{item.title}</p>
            <p className="mt-4 text-3xl font-bold text-slate-900">{item.score}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
          </article>
        ))}
      </section>

      <section className="glass-panel p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Bạn đã học được gì</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {softSkillEvidence.map((item) => (
            <article key={item} className="glass-subpanel">
              <p className="text-sm leading-7 text-slate-700">{item}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Skills;
