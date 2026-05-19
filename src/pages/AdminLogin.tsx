import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faSpinner, faShieldAlt } from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import AuthShell from "../components/layout/AuthShell";
import { useAuth } from "../context/AuthContext";

const AdminLogin = () => {
  const { isAdminAuthenticated, adminLogin } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  if (isAdminAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const ok = adminLogin(username.trim(), password);
    if (ok) {
      toast.success("Admin access granted");
      navigate("/admin");
    } else {
      toast.error("Invalid admin credentials");
    }

    setIsLoading(false);
  };

  return (
    <AuthShell
      eyebrow="Restricted access"
      title="Admin sign in"
      description="Enter the admin credentials to open the restricted dashboard."
      footer={<>Back to <button type="button" onClick={() => navigate("/")} className="font-semibold text-primary-700 hover:text-primary-800">client dashboard</button></>}
    >
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <FontAwesomeIcon icon={faShieldAlt} className="text-xl" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-slate-900">Admin access</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This area is separate from the client workspace.
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
              placeholder="Admin username"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                placeholder="Admin password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition-colors hover:text-primary-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading && <FontAwesomeIcon icon={faSpinner} spin />}
            Enter admin area
          </button>
        </form>
      </div>
    </AuthShell>
  );
};

export default AdminLogin;
