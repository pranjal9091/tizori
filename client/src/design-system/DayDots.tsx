import React from 'react';

interface DayDotsProps {
  daysLeft: number;
}

export const DayDots: React.FC<DayDotsProps> = ({ daysLeft }) => {
  const now = new Date();
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const todayDate = Math.min(Math.max(1, totalDays - daysLeft + 1), totalDays);

  const dots = [];
  for (let day = 1; day <= totalDays; day++) {
    const isPast = day < todayDate;
    const isToday = day === todayDate;
    const isFuture = day > todayDate;

    dots.push({ day, isPast, isToday, isFuture });
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '4px',
        maxWidth: '100%',
        marginTop: '0.4rem',
      }}
      role="meter"
      aria-label={`Day ${todayDate} of ${totalDays}, ${daysLeft} days remaining this month`}
      aria-valuenow={todayDate}
      aria-valuemin={1}
      aria-valuemax={totalDays}
    >
      {dots.map(({ day, isPast, isToday }) => (
        <span
          key={day}
          title={`Day ${day}${isToday ? ' (Today)' : isPast ? ' (Past)' : ' (Upcoming)'}`}
          style={{
            width: isToday ? '11px' : '7px',
            height: isToday ? '11px' : '7px',
            borderRadius: '50%',
            display: 'inline-block',
            transition: 'all 0.2s ease',
            backgroundColor: isPast
              ? 'var(--primary-soft)'
              : isToday
              ? 'var(--accent)'
              : 'transparent',
            border: isToday
              ? '2px solid var(--accent)'
              : isPast
              ? '1px solid var(--primary)'
              : '1px solid var(--line)',
            boxShadow: isToday ? '0 0 0 2px var(--accent-soft)' : 'none',
          }}
        />
      ))}
      <span
        style={{
          fontSize: '0.75rem',
          color: 'var(--ink-muted)',
          marginLeft: '0.5rem',
          fontWeight: 600,
        }}
        className="mono"
      >
        {todayDate}/{totalDays} days ({daysLeft} days remaining)
      </span>
    </div>
  );
};
