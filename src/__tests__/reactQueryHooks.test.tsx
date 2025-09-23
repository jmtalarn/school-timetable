import { describe, it, expect } from 'vitest'
import {
	useMatters,
	useCreateMatter,
	useUpdateMatter,
	useDeleteMatter,
	useKids,
	useCreateKid,
	useUpdateKid,
	useDeleteKid,
	useTimetable,
	useSetDayBlocks,
	useAddBlock,
	useUpdateBlock,
	useDeleteBlock
} from '../hooks/reactQueryHooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import React from 'react'

const queryClient = new QueryClient()

// Example: test useMatters hook

describe('reactQueryHooks', () => {
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	)

	it('useMatters returns data', () => {
		const { result } = renderHook(() => useMatters(), { wrapper })
		expect(result.current).toBeDefined()
	})

	it('useCreateMatter mutation works', async () => {
		const { result } = renderHook(() => useCreateMatter(), { wrapper })
		expect(result.current.mutate).toBeDefined()
	})

	it('useUpdateMatter mutation works', async () => {
		const { result } = renderHook(() => useUpdateMatter(), { wrapper })
		expect(result.current.mutate).toBeDefined()
	})

	it('useDeleteMatter mutation works', async () => {
		const { result } = renderHook(() => useDeleteMatter(), { wrapper })
		expect(result.current.mutate).toBeDefined()
	})

	it('useKids returns data', () => {
		const { result } = renderHook(() => useKids(), { wrapper })
		expect(result.current).toBeDefined()
	})

	it('useCreateKid mutation works', async () => {
		const { result } = renderHook(() => useCreateKid(), { wrapper })
		expect(result.current.mutate).toBeDefined()
	})

	it('useUpdateKid mutation works', async () => {
		const { result } = renderHook(() => useUpdateKid(), { wrapper })
		expect(result.current.mutate).toBeDefined()
	})

	it('useDeleteKid mutation works', async () => {
		const { result } = renderHook(() => useDeleteKid(), { wrapper })
		expect(result.current.mutate).toBeDefined()
	})

	it('useTimetable returns data for a kid', () => {
		const { result } = renderHook(() => useTimetable('test-kid-id'), { wrapper })
		expect(result.current).toBeDefined()
	})

	it('useSetDayBlocks mutation works', async () => {
		const { result } = renderHook(() => useSetDayBlocks(), { wrapper })
		expect(result.current.mutate).toBeDefined()
	})

	it('useAddBlock mutation works', async () => {
		const { result } = renderHook(() => useAddBlock(), { wrapper })
		expect(result.current.mutate).toBeDefined()
	})

	it('useUpdateBlock mutation works', async () => {
		const { result } = renderHook(() => useUpdateBlock(), { wrapper })
		expect(result.current.mutate).toBeDefined()
	})

	it('useDeleteBlock mutation works', async () => {
		const { result } = renderHook(() => useDeleteBlock(), { wrapper })
		expect(result.current.mutate).toBeDefined()
	})
})
