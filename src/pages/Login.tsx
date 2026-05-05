import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import { ENDPOINTS } from '../config';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import AuthShell from '../components/layout/AuthShell';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
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
      eyebrow="Welcome back"
      title="Sign in to Property Eye"
      description="Access fraud monitoring, listing reviews, and registry-backed verification from one secure workspace."
      footer={<>Don&apos;t have an account? <Link to="/signup" className="font-semibold text-primary-700 hover:text-primary-800">Create one</Link></>}
    >
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
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
              <span className="text-xs font-medium text-slate-400">Protected session</span>
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
      </div>
    </AuthShell>
  );
};

export default Login;
