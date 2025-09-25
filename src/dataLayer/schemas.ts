import z from "zod";
import { toMin } from "../utils/time";

export const MatterSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
	color: z.string().optional(), // hex or css var (optional)
	startDate: z.string().optional(), // ISO date string
	endDate: z.string().optional(), // ISO date string
});
export type Matter = z.infer<typeof MatterSchema>;

export const KidSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
});
export type Kid = z.infer<typeof KidSchema>;

export const WeekdaySchema = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
export type Weekday = z.infer<typeof WeekdaySchema>;

const timeString = () =>
	z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Use 24h HH:mm format');

export const TimeBlockSchema = z.object({
	id: z.string(),
	matterId: z.string(),
	start: timeString(),
	end: timeString(),
});

export type TimeBlock = z.infer<typeof TimeBlockSchema>;

export const TimetableSchema = z.object({
	kidId: z.string(),
	days: z.record(WeekdaySchema, z.array(TimeBlockSchema)),
});
export type Timetable = z.infer<typeof TimetableSchema>;

export const ExportBundleSchema = z.object({
	version: z.literal(1),
	matters: z.array(MatterSchema),
	kids: z.array(KidSchema),
	timetables: z.array(TimetableSchema),
});
export type ExportBundle = z.infer<typeof ExportBundleSchema>;


const HHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm')

export const ConfigSchema = z.object({
	startHour: HHMM,
	endHour: HHMM,
	hiddenWeekdays: z.array(WeekdaySchema).default([]),
	startOfWeek: WeekdaySchema.default('mon'),
}).refine(v => toMin(v.startHour) < toMin(v.endHour), {
	message: 'startHour must be before endHour',
	path: ['endHour'],
})


export type ConfigSchemaT = z.infer<typeof ConfigSchema>
