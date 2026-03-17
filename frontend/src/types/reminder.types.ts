export type ReminderType = 'DAILY_SUMMARY' | 'SPACED_REP_DUE' | 'STREAK_ALERT'

export interface Reminder {
  id: string
  type: ReminderType
  title: string
  body: string
  read: boolean
  createdAt: string
}

export interface UnreadCountResponse {
  count: number
}
