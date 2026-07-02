import type {
  WidgetClickedParams,
  DashboardViewedParams,
  OverlayOpenedParams,
  OverlayFiltersChangedParams,
  OverlayChartExploredParams,
  OverlayTableExploredParams,
  OverlayDownloadClickedParams,
  OverlayClosedParams,
  CallRecordingPlayedParams,
} from '@/types/telemetry'
import { initMixpanel, isMixpanelReady, mixpanel } from '@/lib/mixpanel'
import { getUser } from '@/utils/token-storage'

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN!

type TelemetryProperties = Record<string, unknown>

export function initTelemetry() {
  initMixpanel(MIXPANEL_TOKEN)
}

export function identifyUser(
  userId: string,
  traits?: TelemetryProperties
): void {
  if (!isMixpanelReady()) return

  mixpanel.identify(userId)

  if (traits && Object.keys(traits).length > 0) {
    mixpanel.people.set(traits)
  }
}

export function trackEvent(
  eventName: string,
  properties?: TelemetryProperties
): void {
  if (!isMixpanelReady()) return
  mixpanel.track(eventName, {
    ...properties,
    dealer_id: getUser()?.dealer_id,
    employee_id: getUser()?.employee_id,
    org_user_id: getUser()?.org_user_id,
  })
}

export function trackPageView(
  pageName?: string,
  properties?: TelemetryProperties
): void {
  if (!isMixpanelReady()) return

  const defaultProps: TelemetryProperties = {
    path: window.location.pathname,
  }

  mixpanel.track(pageName ?? 'Page View', {
    ...defaultProps,
    ...properties,
  })
}

export function trackWidgetClicked(params: WidgetClickedParams): void {
  trackEvent('widget_clicked', params)
}

export function trackDashboardViewed(params: DashboardViewedParams): void {
  trackEvent('dashboard_viewed', params)
}

export function trackOverlayOpened(params: OverlayOpenedParams): void {
  trackEvent('overlay_opened', params)
}

export function trackOverlayClosed(params: OverlayClosedParams): void {
  trackEvent('overlay_closed', params)
}

export function trackOverlayFiltersChanged(
  params: OverlayFiltersChangedParams
): void {
  trackEvent('overlay_filters_changed', params)
}

export function trackOverlayDownloadClicked(
  params: OverlayDownloadClickedParams
): void {
  trackEvent('overlay_download_clicked', params)
}

export function trackOverlayChartExplored(
  params: OverlayChartExploredParams
): void {
  trackEvent('overlay_chart_explored', params)
}

export function trackOverlayTableExplored(
  params: OverlayTableExploredParams
): void {
  trackEvent('overlay_table_explored', params)
}

export function trackCallRecordingPlayed(
  params: CallRecordingPlayedParams
): void {
  trackEvent('call_recording_played', params)
}
