import { useEffect, useRef, useState, type ChangeEvent, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import { ENDPOINTS } from '../config';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faKey, faLock, faSpinner, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import AuthShell from '../components/layout/AuthShell';

const LOGIN_PASSWORD_KEY = 'browser_login_password';
const LOGIN_PASSCODE = '0000';
const PASSCODE_LENGTH = 4;

type ViewState = 'login' | 'change-password';

const Login = () => {
  const [view, setView] = useState<ViewState>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passcode, setPasscode] = useState<string[]>(Array(PASSCODE_LENGTH).fill(''));
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const passcodeRefs = useRef<Array<HTMLInputElement | null>>([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedPassword = localStorage.getItem(LOGIN_PASSWORD_KEY);
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

  const updatePasscodeDigit = (index: number, value: string) => {
    const nextValue = value.replace(/\D/g, '').slice(0, 1);

    setPasscode((current) => {
      const next = [...current];
      next[index] = nextValue;
      return next;
    });

    if (nextValue && index < PASSCODE_LENGTH - 1) {
      passcodeRefs.current[index + 1]?.focus();
    }
  };

  const handlePasscodeKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !passcode[index] && index > 0) {
      passcodeRefs.current[index - 1]?.focus();
    }
  };

  const handlePasscodePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, PASSCODE_LENGTH - index);
    if (!pasted) {
      return;
    }

    setPasscode((current) => {
      const next = [...current];
      pasted.split('').forEach((digit, offset) => {
        if (index + offset < PASSCODE_LENGTH) {
          next[index + offset] = digit;
        }
      });
      return next;
    });

    const nextIndex = Math.min(index + pasted.length, PASSCODE_LENGTH - 1);
    passcodeRefs.current[nextIndex]?.focus();
  };

  const resetPasswordPanel = () => {
    setNewPassword('');
    setConfirmPassword('');
    setPasscode(Array(PASSCODE_LENGTH).fill(''));
    setView('login');
  };

  const handlePasswordChangeSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!username) {
        toast.error('Please enter your username first.');
        setView('login');
        return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    const passcodeString = passcode.join('');
    if (passcodeString.length !== PASSCODE_LENGTH) {
        toast.error('Please enter the full confirmation passcode.');
        return;
    }

    setIsSavingPassword(true);
    try {
        await api.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
            username,
            new_password: newPassword,
            confirm_passcode: passcodeString
        });
        
        toast.success('Password updated successfully in the backend.');
        setPassword(newPassword);
        // Clear saved local password if any
        localStorage.removeItem(LOGIN_PASSWORD_KEY);
        resetPasswordPanel();
    } catch (error: any) {
        toast.error(error.response?.data?.detail || 'Failed to update password');
    } finally {
        setIsSavingPassword(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post(ENDPOINTS.AUTH.LOGIN, { username, password });
      const { access_token, agency_name, agency_id } = response.data;
      
      login(access_token, { agency_id, agency_name, sub: agency_id });
      toast.success('Logged in successfully');
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow={view === 'login' ? "Welcome back" : "Security"}
      title={view === 'login' ? "Sign in to Property Eye" : "Reset your password"}
      description={view === 'login' 
        ? "Access fraud monitoring, listing reviews, and registry-backed verification from one secure workspace."
        : "Enter your new credentials below to update your account access."}
      footer={view === 'login' ? (
        <>Don&apos;t have an account? <Link to="/signup" className="font-semibold text-primary-700 hover:text-primary-800">Create one</Link></>
      ) : (
        <button onClick={() => setView('login')} className="flex items-center gap-2 font-semibold text-primary-700 hover:text-primary-800">
          <FontAwesomeIcon icon={faArrowLeft} /> Back to login
        </button>
      )}
    >
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {view === 'login' ? (
          <>
            <div className="mb-6">
              <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
                  <path d="M12 3.5c4.6 0 8.45 2.84 10 6.86-1.55 4.03-5.4 6.87-10 6.87S3.55 14.39 2 10.36C3.55 6.34 7.4 3.5 12 3.5Z" fill="currentColor" opacity="0.22" />
                  <path d="M12 6.5c3.57 0 6.61 2.1 7.92 5.07C18.61 14.54 15.57 16.64 12 16.64c-3.57 0-6.61-2.1-7.92-5.07C5.39 8.6 8.43 6.5 12 6.5Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="12" cy="11.57" r="2.7" fill="currentColor" />
                </svg>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-900 text-balance">Secure account login</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 text-pretty">
                Use your agency credentials to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <button 
                    type="button"
                    onClick={() => setView('change-password')}
                    className="text-xs font-semibold text-primary-700 hover:text-primary-800"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition-colors hover:text-primary-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading && <FontAwesomeIcon icon={faSpinner} spin />}
                Sign in
              </button>
            </form>
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
                <FontAwesomeIcon icon={faKey} className="size-6" />
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-900">Change your password</h2>
              <p className="mt-2 text-sm text-slate-600">
                Updating credentials for <span className="font-semibold text-slate-900">{username || 'your account'}</span>
              </p>
            </div>

            <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  placeholder="Enter a new password"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                  placeholder="Re-enter the new password"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <FontAwesomeIcon icon={faLock} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Confirmation code</h4>
                    <p className="text-xs text-slate-500">Enter the 4-digit passcode to apply the change.</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:gap-4">
                  {passcode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        passcodeRefs.current[index] = element;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(event: ChangeEvent<HTMLInputElement>) => updatePasscodeDigit(index, event.target.value)}
                      onKeyDown={(event) => handlePasscodeKeyDown(index, event)}
                      onPaste={(event) => handlePasscodePaste(index, event)}
                      className="h-16 w-14 rounded-2xl border border-slate-300 bg-white text-center text-2xl font-semibold tracking-[0.35em] text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                      aria-label={`Passcode digit ${index + 1}`}
                    />
                  ))}
                </div>

                <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  Expected code: 0000
                </p>
              </div>

              <button
                type="submit"
                disabled={isSavingPassword}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSavingPassword && <FontAwesomeIcon icon={faSpinner} spin />}
                Save password
              </button>
            </form>
          </div>
        )}
      </div>
    </AuthShell>
  );
};

export default Login;
