export const qk = {
	all: ['app'] as const,
	matters: () => [...qk.all, 'matters'] as const,
	matter: (id: string) => [...qk.matters(), id] as const,
	kids: () => [...qk.all, 'kids'] as const,
	kid: (id: string) => [...qk.kids(), id] as const,
	timetables: () => [...qk.all, 'timetables'] as const,
	timetableByKid: (kidId: string) => [...qk.timetables(), kidId] as const,
}