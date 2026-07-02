import { DateSeparator } from './date-separator'
import { MessageBubble } from './message-bubble'

interface ChatConversationProps {
  conversation: {
    date: string
    messages: {
      id: string
      message: string
      isOutgoing: boolean
    }[]
  }
}

export function ChatConversationComponent({
  conversation,
}: ChatConversationProps) {
  return (
    <div className='flex-1 overflow-y-auto px-3'>
      <DateSeparator date={conversation.date} />
      <div className='space-y-1'>
        {conversation.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
    </div>
  )
}
