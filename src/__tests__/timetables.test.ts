
import { describe, it, expect } from 'vitest'
import { getTimetable, setDayBlocks, addBlock, updateBlock, deleteBlock } from '../dataLayer/timetables'
import type { TimeBlock } from '../dataLayer/schemas'

describe('timetables', () => {
  it('should get a timetable for a kid', () => {
    const kidId = 'test-kid-id'
    const timetable = getTimetable(kidId)
    expect(timetable.kidId).toBe(kidId)
    expect(typeof timetable.days).toBe('object')
  })

  it('should set day blocks', () => {
    const kidId = 'test-kid-id'
  const blocks: TimeBlock[] = []
    const timetable = setDayBlocks({ kidId, day: 'mon', blocks })
    expect(timetable.days['mon']).toEqual(blocks)
  })

  it('should add, update, and delete a block', () => {
    const kidId = 'test-kid-id'
    const blockInput = { matterId: 'mat-id', start: '08:00', end: '09:00' }
    const block = addBlock({ kidId, day: 'mon', input: blockInput })
    expect(block.matterId).toBe('mat-id')
    const updated = updateBlock({ kidId, day: 'mon', id: block.id, patch: { end: '10:00' } })
    expect(updated.end).toBe('10:00')
    deleteBlock({ kidId, day: 'mon', id: block.id })
    // Should not throw
  })
})
