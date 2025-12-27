import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    hasLog: boolean;
    isToday: boolean;
    isPast: boolean;
}

interface CalendarViewProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    loggedDates: Date[];
}

export function CalendarView({ selectedDate, onDateSelect, loggedDates }: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(selectedDate);

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Get all days to display in calendar grid
    const getCalendarDays = (): CalendarDay[] => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        // First day of the month
        const firstDay = new Date(year, month, 1);
        const startingDayOfWeek = firstDay.getDay();

        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);
        const endingDayOfWeek = lastDay.getDay();

        const days: CalendarDay[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Add previous month's days
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, prevMonthLastDay - i);
            days.push({
                date,
                isCurrentMonth: false,
                hasLog: hasLogForDate(date),
                isToday: date.getTime() === today.getTime(),
                isPast: date < today,
            });
        }

        // Add current month's days
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(year, month, day);
            days.push({
                date,
                isCurrentMonth: true,
                hasLog: hasLogForDate(date),
                isToday: date.getTime() === today.getTime(),
                isPast: date < today,
            });
        }

        // Add next month's days
        const remainingDays = 6 - endingDayOfWeek;
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(year, month + 1, day);
            days.push({
                date,
                isCurrentMonth: false,
                hasLog: hasLogForDate(date),
                isToday: date.getTime() === today.getTime(),
                isPast: date < today,
            });
        }

        return days;
    };

    const hasLogForDate = (date: Date): boolean => {
        return loggedDates.some(logDate => {
            const log = new Date(logDate);
            log.setHours(0, 0, 0, 0);
            const check = new Date(date);
            check.setHours(0, 0, 0, 0);
            return log.getTime() === check.getTime();
        });
    };

    const previousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentMonth(today);
        onDateSelect(today);
    };

    const monthYear = currentMonth.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    const calendarDays = getCalendarDays();

    return (
        <div className="bg-card rounded-lg border shadow-sm p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold">{monthYear}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToToday}
                        className="text-sm"
                    >
                        Today
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={previousMonth}
                        className="h-8 w-8"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={nextMonth}
                        className="h-8 w-8"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map(day => (
                    <div
                        key={day}
                        className="text-center text-sm font-medium text-muted-foreground py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                    const isSelected =
                        day.date.getDate() === selectedDate.getDate() &&
                        day.date.getMonth() === selectedDate.getMonth() &&
                        day.date.getFullYear() === selectedDate.getFullYear();

                    return (
                        <button
                            key={index}
                            onClick={() => onDateSelect(day.date)}
                            className={cn(
                                "relative aspect-square flex items-center justify-center rounded-lg text-sm transition-all",
                                "hover:bg-accent",
                                !day.isCurrentMonth && "text-muted-foreground/40",
                                day.isToday && "font-bold border-2 border-primary",
                                isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                                day.hasLog && !isSelected && "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100",
                                day.isPast && !day.hasLog && day.isCurrentMonth && "text-muted-foreground"
                            )}
                        >
                            {day.date.getDate()}
                            {day.hasLog && (
                                <div className={cn(
                                    "absolute bottom-1 w-1 h-1 rounded-full",
                                    isSelected ? "bg-primary-foreground" : "bg-green-600 dark:bg-green-400"
                                )} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-6 pt-4 border-t text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-600 dark:bg-green-400" />
                    <span className="text-muted-foreground">Logged</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-lg border-2 border-primary" />
                    <span className="text-muted-foreground">Today</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-lg bg-primary" />
                    <span className="text-muted-foreground">Selected</span>
                </div>
            </div>
        </div>
    );
}
