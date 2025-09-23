export type Matter = {
    id: string;
    name: string;
    color?: string; // hex or css var (optional)
};

export type Kid = {
    id: string;
    name: string;
};

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

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