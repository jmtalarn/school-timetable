import { describe, it, expect } from 'vitest'
import { listMatters, createMatter, updateMatter, deleteMatter } from '../dataLayer/matters'

describe('matters', () => {
  it('should create a new matter', () => {
    const input = { name: 'Math', color: '#fff' }
    const matter = createMatter(input)
    expect(matter).toMatchObject(input)
    expect(typeof matter.id).toBe('string')
  })

  it('should list matters', () => {
    const matters = listMatters()
    expect(Array.isArray(matters)).toBe(true)
  })

  it('should update a matter', () => {
    const input = { name: 'Science', color: '#000' }
    const matter = createMatter(input)
    const updated = updateMatter(matter.id, { name: 'Physics' })
    expect(updated.name).toBe('Physics')
  })

  it('should delete a matter', () => {
    const input = { name: 'Art', color: '#123' }
    const matter = createMatter(input)
    deleteMatter(matter.id)
    const matters = listMatters()
    expect(matters.find(m => m.id === matter.id)).toBeUndefined()
  })
})
