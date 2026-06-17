import { getTodayDateString } from './dateUtils'

describe('getTodayDateString', () => {
  it('formats dates in the Africa/Nairobi timezone', () => {
    const lateUtcDate = new Date('2026-06-16T22:30:00.000Z')

    expect(getTodayDateString(lateUtcDate)).toBe('2026-06-17')
  })
})
