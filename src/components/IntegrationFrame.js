import React from 'react';

const IntegrationFrame = ({ title, owner, description, expectedInput, expectedOutput }) => {
  return (
    <div className="glass-panel glass-frame p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="glass-chip mb-3">Khung tích hợp</div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <div className="glass-badge whitespace-nowrap">{owner}</div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/50 bg-white/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Dữ liệu đầu vào kỳ vọng</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {expectedInput.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="font-mono text-[13px]">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/50 bg-white/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Cách frontend sử dụng</p>
          <p className="mt-3 text-sm leading-6 text-slate-700">{expectedOutput}</p>
        </div>
      </div>
    </div>
  );
};

export default IntegrationFrame;
