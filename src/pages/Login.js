import React, { useMemo, useState } from 'react';
import {
  loginWithCredentials,
  registerWithCredentials,
  resetPasswordWithToken,
  sendForgotPasswordEmail,
  verifyResetPasswordToken,
} from '../auth';

const getResetTokenFromUrl = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('token') || params.get('reset_token') || '';
};

const getInitialMode = () => (getResetTokenFromUrl() ? 'reset' : 'login');

const modeTitle = {
  login: 'Luyen Code',
  register: 'Tạo tài khoản',
  forgot: 'Quên mật khẩu',
  reset: 'Đặt lại mật khẩu',
};

const modeDescription = {
  login: 'Nhập email hoặc MSSV để truy cập dashboard.',
  register: 'Tạo tài khoản sinh viên bằng thông tin lớp học.',
  forgot: 'Nhập email đã đăng ký. Hệ thống sẽ gửi link đặt lại mật khẩu vào email của bạn.',
  reset: 'Nhập mật khẩu mới cho tài khoản của bạn.',
};

const Login = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState(getInitialMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState('');
  const [resetToken] = useState(getResetTokenFromUrl);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const currentTitle = modeTitle[mode];
  const currentDescription = modeDescription[mode];

  const actionLabel = useMemo(() => {
    if (submitting) return 'Đang xử lý...';
    if (mode === 'register') return 'Đăng ký';
    if (mode === 'forgot') return 'Đặt lại mật khẩu';
    if (mode === 'reset') return 'Đổi mật khẩu';
    return 'Đăng nhập';
  }, [mode, submitting]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      throw new Error('Vui lòng nhập email hoặc MSSV và mật khẩu.');
    }

    const { user } = await loginWithCredentials({ identifier, password });

    if (!user) {
      throw new Error('Không lấy được thông tin người dùng.');
    }

    if (onLoginSuccess) {
      onLoginSuccess(user);
    }
  };

  const handleRegister = async () => {
    if (!email.trim() || !password || !fullName.trim() || !className.trim()) {
      throw new Error('Vui lòng nhập đầy đủ email, họ tên, lớp và mật khẩu.');
    }

    await registerWithCredentials({ email, password, fullName, className });
    setSuccessMessage('Đăng ký thành công. Bạn có thể đăng nhập bằng email hoặc MSSV.');
    setIdentifier(email);
    setPassword('');
    setMode('login');
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      throw new Error('Vui lòng nhập email.');
    }

    await sendForgotPasswordEmail(email);
    setSuccessMessage('Nếu email tồn tại, hệ thống sẽ gửi link đặt lại mật khẩu vào email của bạn.');
  };

  const handleResetPassword = async () => {
    if (!resetToken) {
      throw new Error('Link đặt lại mật khẩu không hợp lệ hoặc thiếu token.');
    }

    if (!password || !confirmPassword) {
      throw new Error('Vui lòng nhập mật khẩu mới và xác nhận mật khẩu.');
    }

    if (password !== confirmPassword) {
      throw new Error('Mật khẩu xác nhận không khớp.');
    }

    await verifyResetPasswordToken(resetToken);
    await resetPasswordWithToken({ token: resetToken, password, confirmPassword });
    setSuccessMessage('Đổi mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.');
    setPassword('');
    setConfirmPassword('');
    setMode('login');

    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');

      if (mode === 'register') {
        await handleRegister();
      } else if (mode === 'forgot') {
        await handleForgotPassword();
      } else if (mode === 'reset') {
        await handleResetPassword();
      } else {
        await handleLogin();
      }
    } catch (error) {
      setErrorMessage(error.message || 'Thao tác thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#edf4ff_34%,#dceafe_100%)] px-4 py-10 text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-140px] top-[-120px] h-80 w-80 rounded-full bg-blue-400/30 blur-3xl" />
        <div className="absolute right-[-120px] top-20 h-96 w-96 rounded-full bg-cyan-300/24 blur-3xl" />
        <div className="absolute bottom-[-140px] left-1/4 h-96 w-96 rounded-full bg-sky-300/18 blur-3xl" />
      </div>

      <section className="glass-panel relative z-10 mx-auto w-full max-w-md p-6 sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-gradient-to-br from-primary-500 to-cyan-400 shadow-[0_18px_35px_rgba(24,86,255,0.22)]">
          <span className="text-lg font-extrabold text-white">LC</span>
        </div>

        <div className="mt-6 text-center">
          <div className="glass-chip">{mode === 'login' ? 'Đăng nhập' : currentTitle}</div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">{currentTitle}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">{currentDescription}</p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {mode === 'login' ? (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Email hoặc MSSV</span>
              <input
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="w-full rounded-[24px] border border-white/55 bg-white/65 px-5 py-4 text-slate-900 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                placeholder="Nhập email hoặc MSSV"
                autoComplete="username"
              />
            </label>
          ) : null}

          {mode === 'register' || mode === 'forgot' ? (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-[24px] border border-white/55 bg-white/65 px-5 py-4 text-slate-900 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                placeholder="Nhập email"
                autoComplete="email"
              />
            </label>
          ) : null}

          {mode === 'register' ? (
            <>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Họ tên</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="w-full rounded-[24px] border border-white/55 bg-white/65 px-5 py-4 text-slate-900 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                  placeholder="Nhập họ tên đúng danh sách lớp"
                  autoComplete="name"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Lớp</span>
                <input
                  type="text"
                  value={className}
                  onChange={(event) => setClassName(event.target.value)}
                  className="w-full rounded-[24px] border border-white/55 bg-white/65 px-5 py-4 text-slate-900 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                  placeholder="Ví dụ: IT3080"
                  autoComplete="organization"
                />
              </label>
            </>
          ) : null}

          {mode !== 'forgot' ? (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                {mode === 'reset' ? 'Mật khẩu mới' : 'Mật khẩu'}
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-[24px] border border-white/55 bg-white/65 px-5 py-4 text-slate-900 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                placeholder={mode === 'reset' ? 'Nhập mật khẩu mới' : 'Nhập mật khẩu'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </label>
          ) : null}

          {mode === 'reset' ? (
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Xác nhận mật khẩu</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-[24px] border border-white/55 bg-white/65 px-5 py-4 text-slate-900 outline-none transition focus:border-primary-300 focus:ring-4 focus:ring-primary-100"
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
              />
            </label>
          ) : null}

          {successMessage ? (
            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-[22px] border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <button type="submit" className="glass-button mt-2 w-full" disabled={submitting}>
            {actionLabel}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-600">
          {mode !== 'login' ? (
            <button type="button" className="hover:text-primary-700" onClick={() => switchMode('login')}>
              Đăng nhập
            </button>
          ) : null}

          {mode !== 'register' && mode !== 'reset' ? (
            <button type="button" className="hover:text-primary-700" onClick={() => switchMode('register')}>
              Đăng ký
            </button>
          ) : null}

          {mode !== 'forgot' && mode !== 'reset' ? (
            <button type="button" className="hover:text-primary-700" onClick={() => switchMode('forgot')}>
              Quên mật khẩu
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default Login;
