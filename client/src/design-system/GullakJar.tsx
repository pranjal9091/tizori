import React from 'react';

interface GullakJarProps {
  percent: number; // 0 to 100
  isDropping?: boolean;
  isCracking?: boolean;
  size?: number;
}

export const GullakJar: React.FC<GullakJarProps> = ({
  percent,
  isDropping = false,
  isCracking = false,
  size = 140,
}) => {
  const clamped = Math.min(100, Math.max(0, percent));
  // SVG viewBox is 0 0 100 120.
  // Jar body roughly from y=30 to y=110 (height 80).
  // Fill height from y=110 up to y=30.
  const fillHeight = (clamped / 100) * 80;
  const fillY = 110 - fillHeight;

  return (
    <div
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size * 1.2}px`,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: isDropping ? 'jarWobble 0.6s ease-in-out' : 'none',
        transformOrigin: 'bottom center',
      }}
    >
      {/* Falling Coin Animation */}
      {isDropping && (
        <div
          style={{
            position: 'absolute',
            top: '0px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FBBF24, #D98324)',
            border: '2px solid #FFFBF3',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            zIndex: 10,
            animation: 'coinFall 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 800,
            color: '#1E2A24',
          }}
        >
          ₹
        </div>
      )}

      {/* SVG Clay Gullak Silhoutte with Fill Mask */}
      <svg
        viewBox="0 0 100 120"
        width={size}
        height={size * 1.2}
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Jar Outline Mask */}
          <mask id={`jar-mask-${clamped}`}>
            <rect width="100" height="120" fill="black" />
            {/* Clay pot body */}
            <path
              d="M 50 25
                 C 65 25, 75 30, 80 45
                 C 88 65, 86 95, 76 108
                 C 70 114, 30 114, 24 108
                 C 14 95, 12 65, 20 45
                 C 25 30, 35 25, 50 25 Z"
              fill="white"
            />
          </mask>
        </defs>

        {/* Earthen Clay Jar Base Background */}
        <path
          d="M 50 25
             C 65 25, 75 30, 80 45
             C 88 65, 86 95, 76 108
             C 70 114, 30 114, 24 108
             C 14 95, 12 65, 20 45
             C 25 30, 35 25, 50 25 Z"
          fill="var(--surface-2)"
          stroke="var(--line)"
          strokeWidth="3"
        />

        {/* Liquid / Coin Fill Level clipped by Jar Mask */}
        <g mask={`url(#jar-mask-${clamped})`}>
          <rect
            x="0"
            y={fillY}
            width="100"
            height={fillHeight + 10}
            fill="var(--accent)"
            style={{
              transition: 'y 0.5s cubic-bezier(0.4, 0, 0.2, 1), height 0.5s ease',
            }}
          />
          {/* Subtle wave top line on fill */}
          {clamped > 2 && (
            <path
              d={`M 10 ${fillY} Q 30 ${fillY - 3}, 50 ${fillY} T 90 ${fillY} L 90 ${fillY + 6} L 10 ${fillY + 6} Z`}
              fill="var(--accent-hover)"
            />
          )}
        </g>

        {/* Jar Top Rim & Slit */}
        <ellipse cx="50" cy="25" rx="16" ry="6" fill="var(--surface-2)" stroke="var(--line)" strokeWidth="2.5" />
        {/* Coin Slot */}
        <rect x="42" y="23" width="16" height="3" rx="1.5" fill="var(--ink)" opacity="0.75" />

        {/* Ear handles of traditional matka/gullak */}
        <path
          d="M 17 48 C 10 52, 10 65, 18 70"
          fill="none"
          stroke="var(--line)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M 83 48 C 90 52, 90 65, 82 70"
          fill="none"
          stroke="var(--line)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Crack lines if cracking state is active */}
        {isCracking && (
          <path
            d="M 45 35 L 52 55 L 44 75 L 56 95 L 48 110"
            fill="none"
            stroke="var(--danger)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: 'fadeUp 0.2s ease-in' }}
          />
        )}
      </svg>
    </div>
  );
};
