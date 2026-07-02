import mixpanel from 'mixpanel-browser'

const isBrowser = typeof window !== 'undefined'

export const mixpanelConfig = {
  //debug: true,
  track_pageview: true,
  // record_sessions_percent: 100,
  // persistence: 'localStorage' as const,
  autocapture: true,
  record_sessions_percent: 100,
  api_host: 'https://api-eu.mixpanel.com',
}

let isInitialized = false

export function initMixpanel(token: string): void {
  if (!isBrowser || isInitialized) return

  if (!token) {
    // eslint-disable-next-line no-console
    console.warn('[mixpanel] Missing token')
    return
  }

  mixpanel.init(token, mixpanelConfig)
  isInitialized = true
}

export function isMixpanelReady(): boolean {
  return isBrowser && isInitialized
}

export { mixpanel }
