/**
 * Messages (Kensium "General Features"): internal messaging system — anyone
 * can create messages and share them with single, multiple or all employees
 * (useful for employees without email ids). Per-recipient read/unread/archive
 * state; the store lives in hooks/use-messages.ts.
 */

export type MessageState = 'unread' | 'read' | 'archived'

export interface InternalMessage {
  id: string
  message: string
  comments: string
  sender: string
  /** Recipient names, or the literal 'All employees'. */
  recipients: string[]
  locations: string[]
  departments: string[]
  positions: string[]
  createdAt: string
  /** Read/unread/archive state for the signed-in recipient. */
  state: MessageState
}

export const seedMessages: InternalMessage[] = [
  {
    id: 'MSG-501',
    message: 'Annual town hall — 18 Jul, 3:00 PM',
    comments:
      'The annual town hall is scheduled for 18 Jul at 3:00 PM in the main auditorium and on Teams. Attendance is expected for all employees; the leadership team will share H1 results and the H2 roadmap. Questions can be submitted in advance to HR.',
    sender: 'Liam Patel',
    recipients: ['All employees'],
    locations: ['Hyderabad', 'Austin', 'London'],
    departments: ['All'],
    positions: ['All'],
    createdAt: '2026-07-07',
    state: 'unread',
  },
  {
    id: 'MSG-502',
    message: 'VPN maintenance window — Friday 9:00 PM IST',
    comments:
      'IT will patch the VPN gateways this Friday between 9:00 PM and 11:00 PM IST. Remote sessions will drop briefly; save your work before the window. Contact the service desk if you cannot reconnect afterwards.',
    sender: 'Yuki Tanaka',
    recipients: ['Dana Whitfield', 'Priya Nair', 'Theo Brooks', 'Amara Okafor'],
    locations: ['Hyderabad', 'London'],
    departments: ['Engineering'],
    positions: ['All'],
    createdAt: '2026-07-08',
    state: 'unread',
  },
  {
    id: 'MSG-503',
    message: 'Welcome Sofia Reyes to Austin Support',
    comments:
      'Please join us in welcoming Sofia Reyes, who joined the Austin Support team on 07 Jul as a Support Specialist. Sofia previously worked in retail operations and will be ramping on the ticketing queue over the next two weeks.',
    sender: 'Marcus Lane',
    recipients: ['All employees'],
    locations: ['Austin'],
    departments: ['Support'],
    positions: ['All'],
    createdAt: '2026-07-06',
    state: 'read',
  },
  {
    id: 'MSG-504',
    message: 'Cafeteria menu revamp from next week',
    comments:
      'Based on the food-committee survey, the Hyderabad cafeteria menu is being revamped from Monday. Breakfast now starts at 8:00 AM and a salad counter has been added. Share feedback in the facilities channel.',
    sender: 'Liam Patel',
    recipients: ['All employees'],
    locations: ['Hyderabad'],
    departments: ['All'],
    positions: ['All'],
    createdAt: '2026-07-02',
    state: 'archived',
  },
  {
    id: 'MSG-505',
    message: 'Insurance enrollment window closes 31 Jul',
    comments:
      'The annual group medical insurance enrollment window closes on 31 Jul. Verify your dependents and nominee details in the self-service portal. Changes after the window will only be possible during a life event.',
    sender: 'Rachel Kim',
    recipients: ['Dana Whitfield', 'Elena Petrova', 'Yuki Tanaka'],
    locations: ['Hyderabad', 'Austin', 'London'],
    departments: ['All'],
    positions: ['Managers'],
    createdAt: '2026-06-30',
    state: 'read',
  },
]
