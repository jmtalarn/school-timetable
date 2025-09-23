import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { uuid } from 'zod/v4'
import { createKid, deleteKid, listKids, updateKid } from '../dataLayer/kids'
import { createMatter, deleteMatter, listMatters, updateMatter } from '../dataLayer/matters'
import { qk } from '../dataLayer/queryKeys'
import type { Kid, Matter, TimeBlock, Weekday } from '../dataLayer/schemas'
import { addBlock, deleteBlock, getTimetable, setDayBlocks, updateBlock } from '../dataLayer/timetables'

// Matters
export function useMatters() {
	return useQuery({
		queryKey: qk.matters(),
		queryFn: async () => listMatters(),
	})
}



export function useCreateMatter() {
	const qc = useQueryClient()
	return useMutation<Matter, unknown, Omit<Matter, 'id'>, { prev: Matter[] }>({
		mutationFn: async (input) => createMatter(input),
		onMutate: async (input) => {
			await qc.cancelQueries({ queryKey: qk.matters() })
			const prev = Array.isArray(qc.getQueryData(qk.matters())) ? qc.getQueryData(qk.matters()) as Matter[] : []
			const optimistic = { id: `tmp-${uuid()}`, ...input }
			qc.setQueryData(qk.matters(), [optimistic, ...prev])
			return { prev }
		},
		onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.matters(), ctx.prev),
		onSettled: () => qc.invalidateQueries({ queryKey: qk.matters() }),
	})
}

export function useUpdateMatter() {
	const qc = useQueryClient()
	return useMutation<Matter, unknown, { id: string; patch: Partial<Matter> }>({
		mutationFn: async ({ id, patch }) => updateMatter(id, patch),
		onSuccess: () => qc.invalidateQueries({ queryKey: qk.matters() }),
	})
}

export function useDeleteMatter() {
	const qc = useQueryClient()
	return useMutation<void, unknown, string>({
		mutationFn: async (id) => deleteMatter(id),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: qk.matters() })
			qc.invalidateQueries({ queryKey: qk.timetables() })
		},
	})
}

// Kids
export function useKids() {
	return useQuery({
		queryKey: qk.kids(),
		queryFn: async () => listKids(),
	})
}

export function useCreateKid() {
	const qc = useQueryClient()
	return useMutation<Kid, unknown, Omit<Kid, 'id'>>({
		mutationFn: async (input) => createKid(input),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: qk.kids() })
			qc.invalidateQueries({ queryKey: qk.timetables() })
		},
	})
}

export function useUpdateKid() {
	const qc = useQueryClient()
	return useMutation<Kid, unknown, { id: string; patch: Partial<Kid> }>({
		mutationFn: async ({ id, patch }) => updateKid(id, patch),
		onSuccess: () => qc.invalidateQueries({ queryKey: qk.kids() }),
	})
}

export function useDeleteKid() {
	const qc = useQueryClient()
	return useMutation<{ kidId: string }, unknown, string>({
		mutationFn: async (kidId) => {
			await deleteKid(kidId)
			return { kidId }
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: qk.kids() })
			qc.invalidateQueries({ queryKey: qk.timetables() })
		},
	})
}

// Timetables
export function useTimetable(kidId: Kid['id']) {
	return useQuery({
		queryKey: qk.timetableByKid(kidId),
		queryFn: async () => getTimetable(kidId),
	})
}

export function useSetDayBlocks() {
	const qc = useQueryClient()
	return useMutation<
		{ kidId: string; day: Weekday; blocks: TimeBlock[] },
		unknown,
		{ kidId: string; day: Weekday; blocks: TimeBlock[] }
	>({
		mutationFn: async (p) => {
			await setDayBlocks(p)
			return { kidId: p.kidId, day: p.day, blocks: p.blocks }
		},
		onSuccess: (_data, p) => qc.invalidateQueries({ queryKey: qk.timetableByKid(p.kidId) }),
	})
}

export function useAddBlock() {
	const qc = useQueryClient()
	return useMutation<
		TimeBlock,
		unknown,
		{
			kidId: string
			day: Weekday
			input: Omit<TimeBlock, "id">
		}
	>({
		mutationFn: async (p) => addBlock(p),
		onSuccess: (_data, p) => qc.invalidateQueries({ queryKey: qk.timetableByKid(p.kidId) }),
	})
}

export function useUpdateBlock() {
	const qc = useQueryClient()
	return useMutation<
		TimeBlock,
		unknown,
		{
			kidId: string
			day: Weekday
			id: string
			patch: Partial<Omit<TimeBlock, "id">>
		}
	>({
		mutationFn: async (p) => updateBlock(p),
		onSuccess: (_data, p) => qc.invalidateQueries({ queryKey: qk.timetableByKid(p.kidId) }),
	})
}

export function useDeleteBlock() {
	const qc = useQueryClient()
	return useMutation<{ kidId: string; day: Weekday; id: string }, unknown, { kidId: string; day: Weekday; id: string }>({
		mutationFn: async (p) => {
			await deleteBlock(p)
			return { kidId: p.kidId, day: p.day, id: p.id }
		},
		onSuccess: (_data, p) => qc.invalidateQueries({ queryKey: qk.timetableByKid(p.kidId) }),
	})
}
