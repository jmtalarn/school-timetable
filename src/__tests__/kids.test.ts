import { describe, it, expect } from 'vitest'
import { listKids, createKid, updateKid, deleteKid } from '../dataLayer/kids'

describe('kids', () => {
  it('should create a new kid', () => {
    const input = { name: 'Alice' }
    const kid = createKid(input)
    expect(kid).toMatchObject(input)
    expect(typeof kid.id).toBe('string')
  })

  it('should list kids', () => {
    const kids = listKids()
    expect(Array.isArray(kids)).toBe(true)
  })

  it('should update a kid', () => {
    const input = { name: 'Bob' }
    const kid = createKid(input)
    const updated = updateKid(kid.id, { name: 'Bobby' })
    expect(updated.name).toBe('Bobby')
  })

  it('should delete a kid', () => {
    const input = { name: 'Charlie' }
    const kid = createKid(input)
    deleteKid(kid.id)
    const kids = listKids()
    expect(kids.find(k => k.id === kid.id)).toBeUndefined()
  })
})
