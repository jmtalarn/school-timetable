export type Matter = {
    id: string;
    name: string;
    color?: string; // hex or css var (optional)
    startDate?: string; // ISO date string
    endDate?: string; // ISO date string
};

export type Kid = {
    id: string;
    name: string;
};

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const weekdays: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export type TimeBlock = {
    id: string;
    matterId: string;
    start: string; // "HH:mm" 24h format
    end: string; // "HH:mm" 24h format
};

export type Timetable = {
    kidId: string;
    days: {
        [key in Weekday]: TimeBlock[];
    };
};

export type ExportBundle = {
    version: 1;
    matters: Matter[];
    kids: Kid[];
    timetables: Timetable[];
};

export interface AppConfig {
    /** "HH:mm" (24h) e.g. "08:00" */
    startHour: string
    /** "HH:mm" (24h) e.g. "18:00" */
    endHour: string
    hiddenWeekdays: Weekday[];
}

export const AllWeekdays: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DefaultAppConfig: AppConfig = {
    startHour: 8,
    endHour: 18,
    hiddenWeekdays: ['sat', 'sun'],
};
