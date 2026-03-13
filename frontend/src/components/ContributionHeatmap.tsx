import React from 'react';
import type { ContributionCalendar } from '@/types';

interface ContributionHeatmapProps {
    calendar: ContributionCalendar;
    accentColor: string;
    theme?: 'light' | 'dark';
}

export default function ContributionHeatmap({ calendar, accentColor, theme = 'light' }: ContributionHeatmapProps) {
    if (!calendar || !calendar.weeks || calendar.weeks.length === 0) {
        return null;
    }

    const isDark = theme === 'dark';
    const emptyColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

    // GitHub's standard contribution levels
    const getLevelColor = (count: number) => {
        if (count === 0) return emptyColor;
        // Using opacity on the accent color to simulate level intensity
        if (count <= 3) return `${accentColor}40`; // 25% opacity
        if (count <= 6) return `${accentColor}80`; // 50% opacity
        if (count <= 10) return `${accentColor}c0`; // 75% opacity
        return accentColor; // 100% opacity
    };

    // Days of week labels
    const days = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
    
    // We only display month labels reasonably spaced out
    const monthLabels: { label: string; offset: number }[] = [];
    let lastMonth = -1;
    
    calendar.weeks.forEach((week, index) => {
        if (week.contributionDays.length > 0) {
            const date = new Date(week.contributionDays[0].date);
            const month = date.getMonth();
            if (month !== lastMonth) {
                // only add if it's the first week of the month (roughly)
                const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                monthLabels.push({ label: MONTHS[month], offset: index });
                lastMonth = month;
            }
        }
    });

    return (
        <div className="w-full overflow-x-auto scroolbar-hide py-2">
            <div className="min-w-max flex flex-col gap-2">
                <div style={{ color: textColor }} className="flex text-xs font-mono px-[30px] justify-between h-4 relative">
                    {monthLabels.map((m, i) => (
                        <span 
                            key={`${m.label}-${i}`} 
                            className="absolute" 
                            style={{ left: `${(m.offset / calendar.weeks.length) * 100}%` }}
                        >
                            {m.label}
                        </span>
                    ))}
                </div>
                
                <div className="flex gap-2">
                    {/* Day Labels */}
                    <div style={{ color: textColor }} className="flex flex-col gap-[3px] text-[10px] font-mono pr-2 justify-between">
                        {days.map((day, i) => (
                            <div key={`day-label-${i}`} className="h-[10px] flex items-center">{day}</div>
                        ))}
                    </div>
                    
                    {/* The Grid */}
                    <div className="flex gap-[3px]">
                        {calendar.weeks.map((week, wIndex) => (
                            <div key={`week-${wIndex}`} className="flex flex-col gap-[3px]">
                                {week.contributionDays.map((day, dIndex) => (
                                    <div
                                        key={`day-${day.date}`}
                                        className="w-[10px] h-[10px] rounded-[2px]"
                                        style={{ backgroundColor: getLevelColor(day.contributionCount) }}
                                        title={`${day.contributionCount} contributions on ${day.date}`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                
                <div style={{ color: textColor }} className="flex justify-between items-center text-xs font-mono mt-2">
                    <div>
                        {calendar.total.toLocaleString()} contributions in the last year
                    </div>
                    <div className="flex items-center gap-1">
                        <span>Less</span>
                        <div className="flex gap-[3px]">
                            <div className="w-[10px] h-[10px] rounded-[2px]" style={{ backgroundColor: emptyColor }} />
                            <div className="w-[10px] h-[10px] rounded-[2px]" style={{ backgroundColor: `${accentColor}40` }} />
                            <div className="w-[10px] h-[10px] rounded-[2px]" style={{ backgroundColor: `${accentColor}80` }} />
                            <div className="w-[10px] h-[10px] rounded-[2px]" style={{ backgroundColor: `${accentColor}c0` }} />
                            <div className="w-[10px] h-[10px] rounded-[2px]" style={{ backgroundColor: accentColor }} />
                        </div>
                        <span>More</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
