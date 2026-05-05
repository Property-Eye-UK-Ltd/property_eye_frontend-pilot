import { useId } from "react";

interface PropertyEyeMarkProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
}

const sizeClasses = {
  sm: "size-10",
  md: "size-14",
  lg: "size-20",
  xl: "size-28",
};

const PropertyEyeMark = ({
  size = "md",
  className = "",
  animate = false,
}: PropertyEyeMarkProps) => {
  const gradientId = useId();
  const glowId = useId();

  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      className={`${sizeClasses[size]} ${className}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="55%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <radialGradient id={glowId} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#fff7ed" stopOpacity="1" />
          <stop offset="50%" stopColor="#fdba74" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle
        cx="60"
        cy="60"
        r="54"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="2.25"
        opacity="0.2"
      />
      <circle
        cx="60"
        cy="60"
        r="44"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
        strokeDasharray="2 5"
        opacity="0.35"
      />
      <path
        d="M18 60c10-16 25-29 42-29s32 13 42 29c-10 16-25 29-42 29S28 76 18 60Z"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M40 60c6.5-7.5 12.7-11.2 20-11.2S73.5 52.5 80 60c-6.5 7.5-12.7 11.2-20 11.2S46.5 67.5 40 60Z"
        fill="rgba(249, 115, 22, 0.08)"
      />
      <circle cx="60" cy="60" r="12" fill={`url(#${gradientId})`} />
      <circle cx="64" cy="56" r="4" fill={`url(#${glowId})`} />
      <circle cx="60" cy="60" r="4.3" fill="#ffffff" fillOpacity="0.25" />
      <path
        d="M30 60h60"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      {animate ? (
        <circle
          cx="60"
          cy="60"
          r="36"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="1.5"
          strokeDasharray="10 9"
          opacity="0.45"
          className="origin-center animate-[spin_14s_linear_infinite]"
        />
      ) : null}
    </svg>
  );
};

export default PropertyEyeMark;
