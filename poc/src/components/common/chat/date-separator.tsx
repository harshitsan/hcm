interface DateSeparatorProps {
  date: string
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className='mx-3 my-4 flex items-center justify-center'>
      <div className='bg-grey-1400 h-px flex-1'></div>
      <span className='text-grey-1300 px-3 text-xs font-medium'>{date}</span>
      <div className='bg-grey-1400 h-px flex-1'></div>
    </div>
  )
}
