export type WidgetClickedParams = {
  dashboard_type: 'lead_performance' | 'contact_ops'
  widget_name: string
  widget_id?: string
  date_range?: string
  department?: string
  branch?: string
  extras?: Record<string, string>
}

export type WidgetClickFilterContext = {
  branch?: string
  department?: string
  startDate?: string | null
  endDate?: string | null
}

export type DashboardViewedParams = {
  dashboard_type: 'lead_performance' | 'contact_ops'
  widget_count: number
  date_range?: string
  department?: string
  branch?: string
}

/** Base context for all overlay events. Pass dashboard_type, widget_name, and filters. */
export type OverlayEventContext = {
  dashboard_type: 'lead_performance' | 'contact_ops'
  widget_name: string
  date_range?: string
  department?: string
  branch?: string
}

export type OverlayOpenedParams = OverlayEventContext

export type OverlayFiltersChangedParams = OverlayEventContext & {
  extras?: Record<string, unknown>
}

export type OverlayChartExploredExtras = {
  detail_type?: 'lead' | 'call' | 'recording' | 'task' | 'booking'
  sales_executive_id?: string
  name?: string
  /** Category / x-axis label of the hovered data point */
  category?: string
  /** Series name of the hovered segment (e.g. "Qualified", "Pending") */
  series_name?: string
  /** Value of the hovered data point */
  value?: number
  data_point_index?: number
  series_index?: number
}

export type OverlayChartExploredParams = OverlayEventContext & {
  extras?: OverlayChartExploredExtras
}

export type OverlayTableExploredExtras = {
  id?: string
  name?: string
}

export type OverlayTableExploredParams = OverlayEventContext & {
  extras?: OverlayTableExploredExtras
}

export type OverlayDownloadClickedParams = OverlayEventContext & {
  filename?: string
}

export type OverlayClosedParams = OverlayEventContext & {
  duration_ms: number
}

/** Fired when user plays a call recording (e.g. in overlay details). */
export type CallRecordingPlayedParams = Partial<OverlayEventContext> & {
  extras?: {
    employee_id?: string
    name?: string
    total_duration?: string
    recording_id?: string
    /** How long the user listened (ms). Sent when they pause or recording ends. */
    duration_played_ms?: number
  }
}
