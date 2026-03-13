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
    const emptyColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)';
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
    
    const currentYear = new Date().getFullYear();
    const currentYearStr = currentYear.toString();

    // 1. Create a fast lookup map for the data we DO have
    const dayCounts = new Map<string, number>();
    calendar.weeks.forEach(w => {
        w.contributionDays.forEach(d => {
            dayCounts.set(d.date, d.contributionCount);
        });
    });

    // 2. Generate a full calendar year of weeks
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);
    
    // Adjust start date to the Sunday of the first week
    const startOfWeek = new Date(startDate);
    startOfWeek.setDate(startDate.getDate() - startDate.getDay());

    const activeWeeks: { contributionDays: { date: string; contributionCount: number; isCurrentYear: boolean }[] }[] = [];
    const currentDate = new Date(startOfWeek);
    let currentWeekDays: { date: string; contributionCount: number; isCurrentYear: boolean }[] = [];

    // Loop until we pass the end of the year AND finish the current week
    while (currentDate <= endDate || currentWeekDays.length > 0) {
        // Adjust for timezone differences so we get the correct 'YYYY-MM-DD'
        const localDate = new Date(currentDate.getTime() - (currentDate.getTimezoneOffset() * 60000));
        const dateString = localDate.toISOString().split('T')[0];
        const isCurrentYear = currentDate.getFullYear() === currentYear;
        
        currentWeekDays.push({
            date: dateString,
            contributionCount: dayCounts.get(dateString) || 0,
            isCurrentYear
        });

        if (currentWeekDays.length === 7) {
            activeWeeks.push({ contributionDays: currentWeekDays });
            currentWeekDays = [];
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }

    const monthLabels: { label: string; offset: number }[] = [];
    let lastMonth = -1;

    activeWeeks.forEach((week, index) => {
        // Find the first day that is in the current year
        const activeDay = week.contributionDays.find(d => d.isCurrentYear);
        if (activeDay) {
            const date = new Date(activeDay.date);
            const month = date.getMonth();
            if (month !== lastMonth) {
                // only add if it's the first week of the month (roughly)
                const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                monthLabels.push({ label: MONTHS[month], offset: index });
                lastMonth = month;
            }
        }
    });

    const currentYearTotal = activeWeeks.reduce((total, week) => {
        return total + week.contributionDays
            .filter(day => day.isCurrentYear)
            .reduce((sum, day) => sum + day.contributionCount, 0);
    }, 0);

    return (
        <div className="w-full overflow-x-auto scroolbar-hide py-2">
            <div className="w-full min-w-[600px] flex flex-col gap-2">
                <div className="flex gap-2 w-full">
                    {/* Day Labels */}
                    <div style={{ color: textColor }} className="flex flex-col text-[10px] font-mono pr-2 justify-between mt-[18px] pb-[3px]">
                        {days.map((day, i) => (
                            <div key={`day-label-${i}`} className="flex items-center flex-1">{day}</div>
                        ))}
                    </div>
                    
                    {/* Month Labels and The Grid */}
                    <div className="flex flex-col flex-grow w-full">
                        <div style={{ color: textColor }} className="h-5 relative text-xs font-mono w-full">
                            {monthLabels.map((m, i) => (
                                <span 
                                    key={`${m.label}-${i}`} 
                                    className="absolute" 
                                    style={{ left: `${(m.offset / activeWeeks.length) * 100}%` }}
                                >
                                    {m.label}
                                </span>
                            ))}
                        </div>

                        <div className="flex w-full gap-[3px]">
                        {activeWeeks.map((week, wIndex) => (
                            <div key={`week-${wIndex}`} className="flex flex-col gap-[3px] flex-1">
                                {week.contributionDays.map((day, dIndex) => {
                                    return (
                                        <div
                                            key={`day-${day.date}`}
                                            className="w-full aspect-square rounded-[2px]"
                                            style={{ 
                                                backgroundColor: day.isCurrentYear ? getLevelColor(day.contributionCount) : 'transparent',
                                                visibility: day.isCurrentYear ? 'visible' : 'hidden'
                                            }}
                                            title={day.isCurrentYear ? `${day.contributionCount} contributions on ${day.date}` : ''}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
                
                <div style={{ color: textColor }} className="flex justify-between items-center text-xs font-mono mt-2">
                    <div>
                        {currentYearTotal.toLocaleString()} contributions in {currentYear}
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
