import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';
import { ENDPOINTS } from '../config';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import AuthShell from '../components/layout/AuthShell';

const Signup = () => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post(ENDPOINTS.AUTH.SIGNUP, { name, username, password });
      toast.success('Account created successfully! Please login.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="New agency setup"
      title="Create your Property Eye workspace"
      description="Set up your agency account to start tracking listings, identifying fraud signals, and verifying ownership records."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-primary-700 hover:text-primary-800">Sign in</Link></>}
    >
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
              <path d="M12 2.5 20 6v6c0 5.13-3.26 8.77-8 9.98C7.26 20.77 4 17.13 4 12V6l8-3.5Z" fill="currentColor" opacity="0.2" />
              <path d="M12 4.1 18.25 6.8v5.06c0 4.12-2.5 7.12-6.25 8.18-3.75-1.06-6.25-4.06-6.25-8.18V6.8L12 4.1Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9.4 11.9 11.2 13.7l3.6-3.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-slate-900 text-balance">Agency registration</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 text-pretty">
            Create credentials for your team lead or operations admin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Agency Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              placeholder="e.g. Horizon Estates"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
              placeholder="Choose a username"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                placeholder="Minimum 6 characters"
                required
                minLength={6}
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
            Create account
          </button>
        </form>
      </div>
    </AuthShell>
  );
};

export default Signup;
