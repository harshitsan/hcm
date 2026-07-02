interface MessageBubbleProps {
  message: {
    id: string
    message: string
    isOutgoing: boolean
  }
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div
      className={`flex ${message.isOutgoing ? 'mr-2 justify-end' : 'ml-2 justify-start'} mb-3`}
    >
      <div className='relative'>
        <div
          className={`max-w-xs rounded-md px-3 py-1 shadow-sm lg:max-w-md ${
            message.isOutgoing
              ? 'bg-green-200 text-gray-800'
              : 'bg-white text-gray-800'
          }`}
        >
          <div className='flex gap-3'>
            <p className='text-dark-100 font-regular text-sm'>
              {message.message}
            </p>
            <div
              className={`mt-1.75 flex items-center justify-end ${
                message.isOutgoing ? 'gap-1' : ''
              }`}
            ></div>
          </div>
        </div>

        {/* Arrow tail - right side for outgoing messages */}
        {message.isOutgoing && (
          <div className='absolute -top-2 -right-1 h-0 w-0 rotate-225 border-t-[12px] border-b-[12px] border-l-[12px] border-t-transparent border-b-transparent border-l-green-200'></div>
        )}

        {/* Arrow tail - left side for incoming messages */}
        {!message.isOutgoing && (
          <div className='absolute -top-2 -left-1 h-0 w-0 -rotate-225 border-t-[12px] border-r-[12px] border-b-[12px] border-t-transparent border-r-white border-b-transparent'></div>
        )}
      </div>
    </div>
  )
}
