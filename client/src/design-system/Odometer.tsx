import React, { useEffect, useState, useRef } from 'react';

interface OdometerProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Odometer: React.FC<OdometerProps> = ({
  value,
  prefix = '₹',
  suffix = '',
  duration = 600,
  className = '',
  style = {},
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const startValRef = useRef(value);
  const targetValRef = useRef(value);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return;
    }

    startValRef.current = displayValue;
    targetValRef.current = value;
    startTimeRef.current = null;

    let animId: number;

    const step = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const progress = Math.min((now - startTimeRef.current) / duration, 1);
      
      // Smooth ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValRef.current + (targetValRef.current - startValRef.current) * easeOut);
      
      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [value, duration]);

  const formatted = new Intl.NumberFormat('en-IN').format(displayValue);

  return (
    <span
      className={`mono ${className}`}
      style={{
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
        ...style,
      }}
    >
      {prefix}{formatted}{suffix}
    </span>
  );
};
