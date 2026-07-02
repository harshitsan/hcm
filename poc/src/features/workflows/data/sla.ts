/**
 * Business-hour calendars + SLA rule-packs (WFE-09, WFE-10, WFE-24) —
 * reusable, versioned, effective-dated configuration read by the engine.
 */

export interface BusinessCalendar {
  id: string
  name: string
  workingDays: string
  workingHours: string
  holidays: string[]
  version: number
  effectiveFrom: string
  status: 'active' | 'draft'
  updatedBy: string
}

export interface SlaPolicy {
  id: string
  name: string
  durationHours: number
  /** Reminder thresholds as % of SLA consumed (fixed 50/75 per WFE-10). */
  reminderThresholds: [number, number]
  /** Escalation fires at this % (always 100 per WFE-10). */
  escalateAtPercent: number
  calendarId: string
  version: number
  effectiveFrom: string
  status: 'active' | 'draft'
  updatedBy: string
}

export const seedCalendars: BusinessCalendar[] = [
  {
    id: 'cal-ist',
    name: 'India Standard — Mon–Fri',
    workingDays: 'Mon–Fri',
    workingHours: '09:30 – 18:30 IST',
    holidays: ['2026-08-15 Independence Day', '2026-10-20 Diwali', '2026-12-25 Christmas'],
    version: 3,
    effectiveFrom: '2026-01-01',
    status: 'active',
    updatedBy: 'Sunita Patil',
  },
  {
    id: 'cal-us',
    name: 'US Central — Mon–Fri',
    workingDays: 'Mon–Fri',
    workingHours: '08:00 – 17:00 CT',
    holidays: ['2026-07-03 Independence Day (obs.)', '2026-11-26 Thanksgiving', '2026-12-25 Christmas'],
    version: 2,
    effectiveFrom: '2026-01-01',
    status: 'active',
    updatedBy: 'Devika Rao',
  },
  {
    id: 'cal-plant',
    name: 'Plant Shifts — Mon–Sat',
    workingDays: 'Mon–Sat',
    workingHours: '06:00 – 22:00 IST (2 shifts)',
    holidays: ['2026-08-15 Independence Day', '2026-10-20 Diwali'],
    version: 1,
    effectiveFrom: '2026-03-01',
    status: 'active',
    updatedBy: 'Meera Iyer',
  },
]

export const seedSlaPolicies: SlaPolicy[] = [
  {
    id: 'sla-std',
    name: 'Standard Approvals — 24 business hrs',
    durationHours: 24,
    reminderThresholds: [50, 75],
    escalateAtPercent: 100,
    calendarId: 'cal-ist',
    version: 2,
    effectiveFrom: '2026-04-01',
    status: 'active',
    updatedBy: 'Sunita Patil',
  },
  {
    id: 'sla-fast',
    name: 'Fast Track — 8 business hrs',
    durationHours: 8,
    reminderThresholds: [50, 75],
    escalateAtPercent: 100,
    calendarId: 'cal-plant',
    version: 1,
    effectiveFrom: '2026-03-01',
    status: 'active',
    updatedBy: 'Meera Iyer',
  },
  {
    id: 'sla-exec',
    name: 'Executive Decisions — 72 business hrs',
    durationHours: 72,
    reminderThresholds: [50, 75],
    escalateAtPercent: 100,
    calendarId: 'cal-us',
    version: 1,
    effectiveFrom: '2025-10-01',
    status: 'active',
    updatedBy: 'Devika Rao',
  },
]
