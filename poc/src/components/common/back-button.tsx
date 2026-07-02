import { useRouter } from '@tanstack/react-router'
import { ChevronLeftIcon } from 'lucide-react'
import { Button } from '../ui/button'

function BackButton() {
  const { history } = useRouter()
  const onClick = () => {
    history.go(-1)
  }
  return (
    <Button variant='ghost' className='!p-0' onClick={onClick}>
      <ChevronLeftIcon className='h-4 w-4' />
    </Button>
  )
}

export default BackButton
