export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

type LogPayload = {
  message?: string
  error?: unknown
  category?: 'api' | 'activity' | 'client_error'
  extra?: Record<string, unknown>
}

// Check if we're in production and should send logs to server
const isProduction =
  import.meta.env.VITE_MODE === 'production' ||
  import.meta.env.VITE_MODE === 'beta' ||
  import.meta.env.VITE_MODE === 'development'

function baseLog(level: LogLevel, payload: LogPayload) {
  const { message, error, extra } = payload
  const meta = { ...extra }

  // Always log to console for local development and debugging
  if (level === 'error') {
    // eslint-disable-next-line no-console
    console.error(message ?? 'Unhandled error', error, meta)
  } else if (level === 'warn') {
    // eslint-disable-next-line no-console
    console.warn(message ?? 'Warning', meta)
  } else if (level === 'info' && !isProduction) {
    // eslint-disable-next-line no-console
    console.info(message ?? 'Info', meta)
  } else {
    // eslint-disable-next-line no-console
    console.debug(message ?? 'Debug', meta)
  }
}

export const logger = {
  error: (payload: LogPayload) => baseLog('error', payload),
  warn: (payload: LogPayload) => baseLog('warn', payload),
  info: (payload: LogPayload) => baseLog('info', payload),
  debug: (payload: LogPayload) => baseLog('debug', payload),
}
