import { ReactNode } from "react";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
}

const AuthShell = ({
  eyebrow,
  title,
  description,
  footer,
  children,
}: AuthShellProps) => {
  return (
    <div className="min-h-dvh bg-primary-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl overflow-hidden rounded-[28px] border border-primary-100 bg-white shadow-xl shadow-primary-900/5 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-primary-600 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.14),_transparent_30%)]" />
          <div className="relative">
            <div className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-primary-50">
              Trusted property operations
            </div>
            <div className="mt-8 max-w-md">
              <p className="text-sm font-semibold uppercase text-primary-100">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-balance">
                {title}
              </h1>
              <p className="mt-4 text-base leading-7 text-pretty text-primary-50/90">
                {description}
              </p>
            </div>
          </div>

          <div className="relative mt-10 rounded-[24px] bg-white/10 p-6 backdrop-blur-sm">
            <svg
              viewBox="0 0 520 320"
              className="h-auto w-full"
              aria-hidden="true"
            >
              <rect x="80" y="36" width="320" height="210" rx="24" fill="#fff7ed" />
              <rect x="112" y="72" width="256" height="28" rx="14" fill="#fdba74" />
              <rect x="112" y="122" width="188" height="18" rx="9" fill="#fed7aa" />
              <rect x="112" y="154" width="150" height="18" rx="9" fill="#fed7aa" />
              <rect x="112" y="194" width="136" height="20" rx="10" fill="#fb923c" />
              <rect x="296" y="122" width="72" height="92" rx="18" fill="#ffedd5" />
              <path
                d="M308 196c18-40 40-67 84-84"
                stroke="#f97316"
                strokeWidth="14"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="370" cy="110" r="46" fill="#ffffff" fillOpacity="0.94" />
              <path
                d="M334 110c12-20 25-30 36-30s24 10 36 30c-12 20-25 30-36 30s-24-10-36-30Z"
                fill="#f97316"
              />
              <circle cx="370" cy="110" r="11" fill="#7c2d12" />
              <circle cx="374" cy="106" r="4" fill="#fff7ed" />
              <path
                d="M106 268c18-14 42-22 72-22h196c30 0 54 8 72 22"
                stroke="#fdba74"
                strokeWidth="14"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="138" cy="50" r="10" fill="#fb923c" fillOpacity="0.9" />
              <circle cx="410" cy="234" r="14" fill="#fed7aa" />
            </svg>

            <div className="mt-5 grid gap-3 text-sm text-primary-50/90 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                Upload checks run against agency listings and ownership records.
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                Review suspicious transactions with a clearer, faster workflow.
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <p className="text-sm font-semibold uppercase text-primary-700">
                {eyebrow}
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900 text-balance">
                {title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600 text-pretty">
                {description}
              </p>
            </div>

            {children}

            <div className="mt-6 text-center text-sm text-slate-600 text-pretty">
              {footer}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthShell;
