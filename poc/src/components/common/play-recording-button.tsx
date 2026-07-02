import { useRef } from 'react'
import { audioManager } from '@/utils/audio-manager'

interface PlayRecordingButtonProps {
  readonly recordingId?: string
  readonly recordingUrl?: string | null
  readonly onPlay?: () => void
  /** Called when user pauses; receives duration listened in ms. */
  readonly onPause?: (durationPlayedMs: number) => void
  /** Called when recording ends; receives duration listened in ms. */
  readonly onEnded?: (durationPlayedMs: number) => void
  readonly disabled?: boolean
  readonly variant?: 'red' | 'blue'
}

export function PlayRecordingButton({
  recordingId,
  recordingUrl,
  onPlay,
  onPause,
  onEnded,
  disabled: _disabled = false,
  variant: _variant = 'red',
}: PlayRecordingButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playStartedAtRef = useRef<number | null>(null)

  const getDurationPlayedMs = (): number => {
    if (playStartedAtRef.current === null) return 0
    return Math.round(Date.now() - playStartedAtRef.current)
  }

  const clearPlayStarted = () => {
    playStartedAtRef.current = null
  }

  return (
    <div className='flex items-center'>
      <audio
        className='h-8 min-w-[300px]'
        ref={audioRef}
        controls
        src={recordingUrl || undefined}
        onPlay={() => {
          if (recordingId && audioRef.current) {
            audioManager.setCurrent(audioRef.current, recordingId)
          }
          playStartedAtRef.current = Date.now()
          onPlay?.()
        }}
        onPause={() => {
          if (recordingId) {
            audioManager.clearCurrent(recordingId)
          }
          const durationMs = getDurationPlayedMs()
          if (durationMs > 0) {
            onPause?.(durationMs)
          }
          clearPlayStarted()
        }}
        onEnded={() => {
          if (recordingId) {
            audioManager.clearCurrent(recordingId)
          }
          const durationMs = getDurationPlayedMs()
          if (durationMs > 0) {
            onEnded?.(durationMs)
          }
          clearPlayStarted()
        }}
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  )
}
