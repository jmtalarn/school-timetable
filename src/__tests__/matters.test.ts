import { describe, it, expect } from 'vitest'
import { listMatters, createMatter, updateMatter, deleteMatter } from '../dataLayer/matters'

describe('matters', () => {

  it('should create a new matter with dates', () => {
    const input = { name: 'Math', color: '#fff', startDate: '2025-09-01', endDate: '2026-06-15' }
    const matter = createMatter(input)
    expect(matter).toMatchObject(input)
    expect(typeof matter.id).toBe('string')
    expect(matter.startDate).toBe('2025-09-01')
    expect(matter.endDate).toBe('2026-06-15')
  })

  it('should list matters', () => {
    const matters = listMatters()
    expect(Array.isArray(matters)).toBe(true)
  })


  it('should update a matter dates', () => {
    const input = { name: 'Science', color: '#000', startDate: '2025-09-01', endDate: '2026-06-15' }
    const matter = createMatter(input)
    const updated = updateMatter(matter.id, { name: 'Physics', startDate: '2025-10-01', endDate: '2026-07-01' })
    expect(updated.name).toBe('Physics')
    expect(updated.startDate).toBe('2025-10-01')
    expect(updated.endDate).toBe('2026-07-01')
  })

  it('should delete a matter', () => {
    const input = { name: 'Art', color: '#123' }
    const matter = createMatter(input)
    deleteMatter(matter.id)
    const matters = listMatters()
    expect(matters.find(m => m.id === matter.id)).toBeUndefined()
  })
})
