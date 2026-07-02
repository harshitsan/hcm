/**
 * Global audio manager to ensure only one audio plays at a time
 */
class AudioManager {
  private currentAudio: HTMLAudioElement | null = null
  private currentRecordingId: string | null = null
  private listeners: Set<(recordingId: string | null) => void> = new Set()

  /**
   * Stops the currently playing audio if it exists
   */
  stopCurrent(): void {
    if (this.currentAudio) {
      this.currentAudio.pause()
      const previousId = this.currentRecordingId
      this.currentAudio = null
      this.currentRecordingId = null
      this.notifyListeners(previousId)
    }
  }

  /**
   * Sets the currently playing audio and stops any previous one
   */
  setCurrent(audio: HTMLAudioElement, recordingId: string): void {
    // Stop previous audio if it's different
    if (this.currentAudio && this.currentRecordingId !== recordingId) {
      this.currentAudio.pause()
      this.notifyListeners(this.currentRecordingId)
    }
    this.currentAudio = audio
    this.currentRecordingId = recordingId
    this.notifyListeners(recordingId)
  }

  /**
   * Clears the current audio reference
   */
  clearCurrent(recordingId: string): void {
    if (this.currentRecordingId === recordingId) {
      this.currentAudio = null
      this.currentRecordingId = null
      this.notifyListeners(recordingId)
    }
  }

  /**
   * Gets the current playing recording ID
   */
  getCurrentRecordingId(): string | null {
    return this.currentRecordingId
  }

  /**
   * Checks if a specific recording is currently playing
   */
  isPlaying(recordingId: string): boolean {
    return (
      this.currentRecordingId === recordingId &&
      this.currentAudio !== null &&
      !this.currentAudio.paused
    )
  }

  /**
   * Subscribe to changes in playing state
   */
  subscribe(listener: (recordingId: string | null) => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(recordingId: string | null): void {
    this.listeners.forEach((listener) => listener(recordingId))
  }
}

export const audioManager = new AudioManager()
