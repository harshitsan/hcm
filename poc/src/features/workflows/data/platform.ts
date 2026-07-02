/**
 * Platform-level tenant provisioning + engine health (WFE-18, WFE-19).
 */

export interface TenantRecord {
  id: string
  name: string
  companies: number
  engineEnabled: boolean
  activeInstances: number
  escalations30d: number
  slaBreaches30d: number
  deniedAttempts30d: number
  health: 'healthy' | 'degraded'
  region: string
}

export const seedTenants: TenantRecord[] = [
  {
    id: 'tn-aurora',
    name: 'Aurora Group',
    companies: 2,
    engineEnabled: true,
    activeInstances: 42,
    escalations30d: 6,
    slaBreaches30d: 3,
    deniedAttempts30d: 1,
    health: 'healthy',
    region: 'ap-south-1',
  },
  {
    id: 'tn-northwind',
    name: 'Northwind Logistics',
    companies: 1,
    engineEnabled: true,
    activeInstances: 17,
    escalations30d: 2,
    slaBreaches30d: 1,
    deniedAttempts30d: 0,
    health: 'healthy',
    region: 'us-east-1',
  },
  {
    id: 'tn-zenith',
    name: 'Zenith Software',
    companies: 1,
    engineEnabled: true,
    activeInstances: 9,
    escalations30d: 4,
    slaBreaches30d: 2,
    deniedAttempts30d: 0,
    health: 'degraded',
    region: 'eu-west-2',
  },
  {
    id: 'tn-meridian',
    name: 'Meridian Corp',
    companies: 3,
    engineEnabled: false,
    activeInstances: 0,
    escalations30d: 0,
    slaBreaches30d: 0,
    deniedAttempts30d: 2,
    health: 'healthy',
    region: 'us-west-2',
  },
]
