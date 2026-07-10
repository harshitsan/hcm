import type { SeedArtifact } from './business-logic'

/**
 * The full Kensium HR Configuration catalog — 174 screens imported as
 * engine artifacts (WFE-43), each attached to its POC module and enabled at
 * every scope level. Generated from kensiumhr-features/Configuration/HRMS;
 * the 18 hand-modeled seeds in business-logic.ts are excluded here.
 */
export const KENSIUM_ARTIFACTS: SeedArtifact[] = [
  {
    "id": "kx-001",
    "name": "Letter Templates",
    "type": "template",
    "targetModule": "HR Letters & Certificates",
    "description": "View a list of agreement letter templates with their template type ID, letter type, and description (Kensium: Agreement)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Letter Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-02",
    "history": [
      {
        "at": "2026-06-02 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-002",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Notifications",
    "description": "Enable the alerts module (Kensium: Alerts)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-03",
    "history": [
      {
        "at": "2026-06-03 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-003",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Asset Management",
    "description": "Enable or disable the asset module via a Yes/No setting (Kensium: Asset Tracking)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-04",
    "history": [
      {
        "at": "2026-06-04 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-004",
    "name": "Attendance Auditors Group",
    "type": "approver-chain",
    "targetModule": "Time & Attendance",
    "description": "Add a new attendance auditors group (Kensium: Attendance Tracking)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-05",
    "history": [
      {
        "at": "2026-06-05 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-005",
    "name": "Audit Configuration Settings",
    "type": "setting",
    "targetModule": "Time & Attendance",
    "description": "Enable support for attendance audit (Kensium: Attendance Tracking)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "audit-configuration-settings",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-06",
    "history": [
      {
        "at": "2026-06-06 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-006",
    "name": "Audit Recurrence Pattern",
    "type": "decision-rule",
    "targetModule": "Time & Attendance",
    "description": "Add a new audit recurrence pattern (Kensium: Attendance Tracking)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "decision-rule",
      "conditions": [
        {
          "attribute": "value",
          "operator": ">",
          "value": "0"
        }
      ],
      "outcome": "Flag for review"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-07",
    "history": [
      {
        "at": "2026-06-07 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-007",
    "name": "Break",
    "type": "setting",
    "targetModule": "Time & Attendance",
    "description": "Add a new break with an allowable duration and applicability (Kensium: Attendance Tracking)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "break",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-08",
    "history": [
      {
        "at": "2026-06-08 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-008",
    "name": "Change Request Approvers",
    "type": "approver-chain",
    "targetModule": "Time & Attendance",
    "description": "Add a new change request approver (Kensium: Attendance Tracking)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-09",
    "history": [
      {
        "at": "2026-06-09 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-009",
    "name": "Comp Off",
    "type": "setting",
    "targetModule": "Time & Attendance",
    "description": "Enable comp off (Kensium: Attendance Tracking)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "comp-off",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-10",
    "history": [
      {
        "at": "2026-06-10 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-010",
    "name": "Email Templates",
    "type": "template",
    "targetModule": "Time & Attendance",
    "description": "View the list of attendance email templates with their type and description (Kensium: Attendance Tracking)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Email Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-11",
    "history": [
      {
        "at": "2026-06-11 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-011",
    "name": "Flexi Schedule Settings",
    "type": "setting",
    "targetModule": "Time & Attendance",
    "description": "Enable flexi schedule settings (Kensium: Attendance Tracking)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "flexi-schedule-settings",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-12",
    "history": [
      {
        "at": "2026-06-12 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-012",
    "name": "Notification Templates",
    "type": "template",
    "targetModule": "Time & Attendance",
    "description": "View the list of attendance notification templates with their type and description (Kensium: Attendance Tracking)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Notification Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-13",
    "history": [
      {
        "at": "2026-06-13 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-013",
    "name": "Out Time Request Settings",
    "type": "setting",
    "targetModule": "Time & Attendance",
    "description": "Add new out time request settings (Kensium: Attendance Tracking)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "out-time-request-settings",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-14",
    "history": [
      {
        "at": "2026-06-14 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-014",
    "name": "Over Time Approvers",
    "type": "approver-chain",
    "targetModule": "Time & Attendance",
    "description": "Add a new over time approver (Kensium: Attendance Tracking)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-15",
    "history": [
      {
        "at": "2026-06-15 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-015",
    "name": "Over Time",
    "type": "setting",
    "targetModule": "Time & Attendance",
    "description": "Enable over time (Kensium: Attendance Tracking)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "over-time",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-16",
    "history": [
      {
        "at": "2026-06-16 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-016",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Time & Attendance",
    "description": "Enable or disable the attendance tracking module (Kensium: Attendance Tracking)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-17",
    "history": [
      {
        "at": "2026-06-17 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-017",
    "name": "Tracking Device",
    "type": "setting",
    "targetModule": "Time & Attendance",
    "description": "Add a new tracking device (Kensium: Attendance Tracking)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "tracking-device",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-18",
    "history": [
      {
        "at": "2026-06-18 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-018",
    "name": "Tracking Mode",
    "type": "setting",
    "targetModule": "Time & Attendance",
    "description": "Add a new tracking mode (Kensium: Attendance Tracking)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "tracking-mode",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-19",
    "history": [
      {
        "at": "2026-06-19 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-019",
    "name": "Work From Home Approvers",
    "type": "approver-chain",
    "targetModule": "Time & Attendance",
    "description": "Add a new work from home approver (Kensium: Attendance Tracking)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-20",
    "history": [
      {
        "at": "2026-06-20 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-020",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Enable or disable the benefit management module (Kensium: Benefits)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-21",
    "history": [
      {
        "at": "2026-06-21 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-021",
    "name": "Configure Calendar",
    "type": "setting",
    "targetModule": "Leave Management",
    "description": "Enable employees to add and view other employees' calendars (Kensium: Calendar)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "configure-calendar",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-22",
    "history": [
      {
        "at": "2026-06-22 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-022",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Leave Management",
    "description": "Enable the calendar module (Kensium: Calendar)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-23",
    "history": [
      {
        "at": "2026-06-23 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-023",
    "name": "Compensation",
    "type": "setting",
    "targetModule": "Employees",
    "description": "View the list of salary slabs with their name, employee class specificity and slab range (Kensium: Compensation)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "compensation",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-24",
    "history": [
      {
        "at": "2026-06-24 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-024",
    "name": "Confirmation Approvers",
    "type": "approver-chain",
    "targetModule": "Employee Lifecycle",
    "description": "View a list of confirmation approvers showing group ID, location, approver(s) and applicability (Kensium: Confirmation)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-25",
    "history": [
      {
        "at": "2026-06-25 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-025",
    "name": "Email Templates",
    "type": "template",
    "targetModule": "Employee Lifecycle",
    "description": "View the list of confirmation email templates with their type and description (Kensium: Confirmation)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Email Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-26",
    "history": [
      {
        "at": "2026-06-26 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-026",
    "name": "Letter Templates",
    "type": "template",
    "targetModule": "Employee Lifecycle",
    "description": "View the list of confirmation letter templates with their type and description (Kensium: Confirmation)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Letter Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-27",
    "history": [
      {
        "at": "2026-06-27 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-027",
    "name": "Notification Templates",
    "type": "template",
    "targetModule": "Employee Lifecycle",
    "description": "View the list of confirmation notification templates with their type and description (Kensium: Confirmation)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Notification Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-28",
    "history": [
      {
        "at": "2026-06-28 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-028",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Employee Lifecycle",
    "description": "Enable or disable the Confirmation Management Module (Kensium: Confirmation)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-01",
    "history": [
      {
        "at": "2026-06-01 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-029",
    "name": "Import Data Log",
    "type": "setting",
    "targetModule": "Data Management",
    "description": "View a log of past imports with module, function, date, importer, and status (Kensium: Data Import)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "import-data-log",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-02",
    "history": [
      {
        "at": "2026-06-02 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-030",
    "name": "Disciplinary Action Approvers",
    "type": "approver-chain",
    "targetModule": "Employee Lifecycle",
    "description": "View a list of disciplinary action approvers with their group ID, location and approvers (Kensium: Disciplinary)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-03",
    "history": [
      {
        "at": "2026-06-03 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-031",
    "name": "Disciplinary Email Templates",
    "type": "template",
    "targetModule": "Employee Lifecycle",
    "description": "View the list of disciplinary action email templates with their type and description (Kensium: Disciplinary)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Disciplinary Email Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-04",
    "history": [
      {
        "at": "2026-06-04 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-032",
    "name": "Disciplinary Letter Templates",
    "type": "template",
    "targetModule": "Employee Lifecycle",
    "description": "View the list of disciplinary action letter templates with their type and description (Kensium: Disciplinary)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Disciplinary Letter Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-05",
    "history": [
      {
        "at": "2026-06-05 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-033",
    "name": "Disciplinary Notification Templates",
    "type": "template",
    "targetModule": "Employee Lifecycle",
    "description": "View the list of disciplinary action notification templates with their type and description (Kensium: Disciplinary)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Disciplinary Notification Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-06",
    "history": [
      {
        "at": "2026-06-06 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-034",
    "name": "Acknowledgement",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Add a new acknowledgement terms configuration (Kensium: Employee Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "acknowledgement",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-07",
    "history": [
      {
        "at": "2026-06-07 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-035",
    "name": "Appreciation Categories",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Add a new appreciation category (Kensium: Employee Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "appreciation-categories",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-08",
    "history": [
      {
        "at": "2026-06-08 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-036",
    "name": "Class Change Approvers",
    "type": "approver-chain",
    "targetModule": "Employees",
    "description": "Add new class change approvers for a location (Kensium: Employee Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-09",
    "history": [
      {
        "at": "2026-06-09 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-037",
    "name": "Document Custodian",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Add a new document custodian (Kensium: Employee Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "document-custodian",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-10",
    "history": [
      {
        "at": "2026-06-10 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-038",
    "name": "Email Templates",
    "type": "template",
    "targetModule": "Employees",
    "description": "View the list of employee management email templates (Kensium: Employee Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Email Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-11",
    "history": [
      {
        "at": "2026-06-11 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-039",
    "name": "Employee Access Permission",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Select an employee class and location before configuring access (Kensium: Employee Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "employee-access-permission",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-12",
    "history": [
      {
        "at": "2026-06-12 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-040",
    "name": "Employee Appreciations",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Configure when employees are notified of their appreciation scores each month (Kensium: Employee Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "employee-appreciations",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-13",
    "history": [
      {
        "at": "2026-06-13 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-041",
    "name": "Employee Dependant Types",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Add a new employee dependant type (Kensium: Employee Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "employee-dependant-types",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-14",
    "history": [
      {
        "at": "2026-06-14 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-042",
    "name": "Employee Life Event Types",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Add a new employee life event type (Kensium: Employee Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "employee-life-event-types",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-15",
    "history": [
      {
        "at": "2026-06-15 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-043",
    "name": "Employee Timeline",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Add a new timeline event (Kensium: Employee Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "employee-timeline",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-16",
    "history": [
      {
        "at": "2026-06-16 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-044",
    "name": "Employee Verification",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Add a new employee verification (Kensium: Employee Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "employee-verification",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-17",
    "history": [
      {
        "at": "2026-06-17 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-045",
    "name": "Notification Templates",
    "type": "template",
    "targetModule": "Employees",
    "description": "View the list of employee notification templates (Kensium: Employee Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Notification Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-18",
    "history": [
      {
        "at": "2026-06-18 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-046",
    "name": "Quadrant Rating",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Set the quadrant rating frequency (Kensium: Employee Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "quadrant-rating",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-19",
    "history": [
      {
        "at": "2026-06-19 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-047",
    "name": "User Defined Fields — User Defined Field (2)",
    "type": "custom-form",
    "targetModule": "Employees",
    "description": "Add a new user defined field (Kensium: Employee Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "custom-form",
      "fields": [
        {
          "label": "Response",
          "fieldType": "text",
          "required": true
        },
        {
          "label": "Effective date",
          "fieldType": "date",
          "required": false
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-20",
    "history": [
      {
        "at": "2026-06-20 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-048",
    "name": "User Defined Fields — User Defined Field",
    "type": "custom-form",
    "targetModule": "Employees",
    "description": "Add a new user defined field (Kensium: Employee Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "custom-form",
      "fields": [
        {
          "label": "Response",
          "fieldType": "text",
          "required": true
        },
        {
          "label": "Effective date",
          "fieldType": "date",
          "required": false
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-21",
    "history": [
      {
        "at": "2026-06-21 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-049",
    "name": "Exit Approvers",
    "type": "approver-chain",
    "targetModule": "Employee Lifecycle",
    "description": "View a list of exit approver groups with their exit type, locations, departments and approvers (Kensium: Exit)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-22",
    "history": [
      {
        "at": "2026-06-22 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-050",
    "name": "Exit Clearance Approvers",
    "type": "approver-chain",
    "targetModule": "Employee Lifecycle",
    "description": "View the configured exit clearance form approvers (Kensium: Exit)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-23",
    "history": [
      {
        "at": "2026-06-23 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-051",
    "name": "Exit Management",
    "type": "setting",
    "targetModule": "Employee Lifecycle",
    "description": "Indicate whether my organization supports exit management (Kensium: Exit)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "exit-management",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-24",
    "history": [
      {
        "at": "2026-06-24 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-052",
    "name": "Layoff Approvers",
    "type": "approver-chain",
    "targetModule": "Employee Lifecycle",
    "description": "Set the minimum number of employees required to initiate a layoff (Kensium: Exit)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-25",
    "history": [
      {
        "at": "2026-06-25 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-053",
    "name": "Letter Templates",
    "type": "template",
    "targetModule": "Employee Lifecycle",
    "description": "View the list of exit letter templates with their type and description (Kensium: Exit)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Letter Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-26",
    "history": [
      {
        "at": "2026-06-26 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-054",
    "name": "Notice Period",
    "type": "setting",
    "targetModule": "Employee Lifecycle",
    "description": "View the list of notice period rules with their duration, applicable locations, departments and position levels (Kensium: Exit)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "notice-period",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-27",
    "history": [
      {
        "at": "2026-06-27 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-055",
    "name": "Feedback - Grievance Receivers",
    "type": "setting",
    "targetModule": "Feedback & Grievance",
    "description": "Indicate whether the organization supports Feedback / Grievance (Kensium: Feedback - Grievance)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "feedback-grievance-receivers",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-28",
    "history": [
      {
        "at": "2026-06-28 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-056",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Feedback & Grievance",
    "description": "Enable or disable the Feedback / Grievance module (Kensium: Feedback - Grievance)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-01",
    "history": [
      {
        "at": "2026-06-01 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-057",
    "name": "Department",
    "type": "setting",
    "targetModule": "Departments",
    "description": "Add a new department (Kensium: General)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "department",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-02",
    "history": [
      {
        "at": "2026-06-02 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-058",
    "name": "Interview Assessment Questions",
    "type": "custom-form",
    "targetModule": "Recruitment",
    "description": "Add a new interview assessment question (Kensium: General)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "custom-form",
      "fields": [
        {
          "label": "Response",
          "fieldType": "text",
          "required": true
        },
        {
          "label": "Effective date",
          "fieldType": "date",
          "required": false
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-03",
    "history": [
      {
        "at": "2026-06-03 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-059",
    "name": "Shift",
    "type": "setting",
    "targetModule": "Time & Attendance",
    "description": "Add a new shift with start and end times (Kensium: General)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "shift",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-04",
    "history": [
      {
        "at": "2026-06-04 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-060",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Companies",
    "description": "Enable or disable the HR budget planner module (Kensium: HR Budget)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-05",
    "history": [
      {
        "at": "2026-06-05 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-061",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Platform Admin",
    "description": "Enable the Acumatica Integration Module by selecting Yes (Kensium: Integrations)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-06",
    "history": [
      {
        "at": "2026-06-06 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-062",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Employee Lifecycle",
    "description": "Enable or disable the knowledge transfer module using a Yes/No option (Kensium: Knowledge Transfer)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-07",
    "history": [
      {
        "at": "2026-06-07 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-063",
    "name": "Certification Questionnaire",
    "type": "custom-form",
    "targetModule": "Employee Lifecycle",
    "description": "Add new certification sponsorship questions (Kensium: Learning Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "custom-form",
      "fields": [
        {
          "label": "Response",
          "fieldType": "text",
          "required": true
        },
        {
          "label": "Effective date",
          "fieldType": "date",
          "required": false
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-08",
    "history": [
      {
        "at": "2026-06-08 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-064",
    "name": "Manage External Trainers",
    "type": "setting",
    "targetModule": "Employee Lifecycle",
    "description": "Add a new external trainer (Kensium: Learning Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "manage-external-trainers",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-09",
    "history": [
      {
        "at": "2026-06-09 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-065",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Employee Lifecycle",
    "description": "Enable or disable the learning management module (Kensium: Learning Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-10",
    "history": [
      {
        "at": "2026-06-10 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-066",
    "name": "Training Cost Approvers",
    "type": "approver-chain",
    "targetModule": "Employee Lifecycle",
    "description": "Add a new training cost approver (Kensium: Learning Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-11",
    "history": [
      {
        "at": "2026-06-11 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-067",
    "name": "Training Topics",
    "type": "setting",
    "targetModule": "Employee Lifecycle",
    "description": "Add a new training topic (Kensium: Learning Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "training-topics",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-12",
    "history": [
      {
        "at": "2026-06-12 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-068",
    "name": "Announcement Images",
    "type": "setting",
    "targetModule": "Announcements",
    "description": "Add new announcement images (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "announcement-images",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-13",
    "history": [
      {
        "at": "2026-06-13 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-069",
    "name": "Announcement",
    "type": "setting",
    "targetModule": "Announcements",
    "description": "Add a new announcement (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "announcement",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-14",
    "history": [
      {
        "at": "2026-06-14 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-070",
    "name": "Assign Roles",
    "type": "setting",
    "targetModule": "Roles & Security",
    "description": "Select a role and assign screens to it (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "assign-roles",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-15",
    "history": [
      {
        "at": "2026-06-15 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-071",
    "name": "Configure Series",
    "type": "setting",
    "targetModule": "Platform Admin",
    "description": "Add a new numbering series (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "configure-series",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-16",
    "history": [
      {
        "at": "2026-06-16 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-072",
    "name": "Document Types",
    "type": "setting",
    "targetModule": "Documents",
    "description": "Add a new document type (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "document-types",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-17",
    "history": [
      {
        "at": "2026-06-17 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-073",
    "name": "Employee Classification",
    "type": "setting",
    "targetModule": "Positions",
    "description": "Add a new employee class (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "employee-classification",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-18",
    "history": [
      {
        "at": "2026-06-18 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-074",
    "name": "Group",
    "type": "setting",
    "targetModule": "Groups",
    "description": "Add a new employee group (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "group",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-19",
    "history": [
      {
        "at": "2026-06-19 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-075",
    "name": "Head Office",
    "type": "setting",
    "targetModule": "Locations",
    "description": "Create or edit the head office organization with its name, type, industry and location (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "head-office",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-20",
    "history": [
      {
        "at": "2026-06-20 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-076",
    "name": "Location",
    "type": "setting",
    "targetModule": "Locations",
    "description": "Add an additional office location (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "location",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-21",
    "history": [
      {
        "at": "2026-06-21 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-077",
    "name": "Login Page Images",
    "type": "setting",
    "targetModule": "Authentication",
    "description": "Upload login page wallpaper images (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "login-page-images",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-22",
    "history": [
      {
        "at": "2026-06-22 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-078",
    "name": "Project Roles",
    "type": "setting",
    "targetModule": "Positions",
    "description": "Add a new project role (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "project-roles",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-23",
    "history": [
      {
        "at": "2026-06-23 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-079",
    "name": "Project Types",
    "type": "setting",
    "targetModule": "Positions",
    "description": "Add a new project type (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "project-types",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-24",
    "history": [
      {
        "at": "2026-06-24 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-080",
    "name": "Required Certificates",
    "type": "setting",
    "targetModule": "Documents",
    "description": "Add a new required certificate (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "required-certificates",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-25",
    "history": [
      {
        "at": "2026-06-25 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-081",
    "name": "Role",
    "type": "setting",
    "targetModule": "Roles & Security",
    "description": "Add a new role (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "role",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-26",
    "history": [
      {
        "at": "2026-06-26 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-082",
    "name": "Schedule Job",
    "type": "setting",
    "targetModule": "Platform Admin",
    "description": "Enable or disable scheduled background jobs such as attendance, leave credit and confirmation jobs (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "schedule-job",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-27",
    "history": [
      {
        "at": "2026-06-27 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-083",
    "name": "Support Team",
    "type": "setting",
    "targetModule": "Platform Admin",
    "description": "Add a new support team (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "support-team",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-28",
    "history": [
      {
        "at": "2026-06-28 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-084",
    "name": "Thought of the day",
    "type": "setting",
    "targetModule": "Announcements",
    "description": "Add a new thought of the day (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "thought-of-the-day",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-01",
    "history": [
      {
        "at": "2026-06-01 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-085",
    "name": "Vendor",
    "type": "setting",
    "targetModule": "Companies",
    "description": "Access the Vendor configuration screen (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "vendor",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-02",
    "history": [
      {
        "at": "2026-06-02 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-086",
    "name": "Work Area",
    "type": "setting",
    "targetModule": "Locations",
    "description": "Add a new work area for a location (Kensium: Organization)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "work-area",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-03",
    "history": [
      {
        "at": "2026-06-03 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-087",
    "name": "Email Templates",
    "type": "template",
    "targetModule": "Employee Lifecycle",
    "description": "View a list of orientation email templates with their type, description and task (Kensium: Orientation)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Email Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-04",
    "history": [
      {
        "at": "2026-06-04 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-088",
    "name": "Notification Rule",
    "type": "decision-rule",
    "targetModule": "Employee Lifecycle",
    "description": "Specify whether a notification frequency rule is required (Kensium: Orientation)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "decision-rule",
      "conditions": [
        {
          "attribute": "value",
          "operator": ">",
          "value": "0"
        }
      ],
      "outcome": "Flag for review"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-05",
    "history": [
      {
        "at": "2026-06-05 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-089",
    "name": "Notification Templates",
    "type": "template",
    "targetModule": "Employee Lifecycle",
    "description": "View a list of orientation notification templates with their type, description and task (Kensium: Orientation)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Notification Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-06",
    "history": [
      {
        "at": "2026-06-06 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-090",
    "name": "Orientation Topics",
    "type": "setting",
    "targetModule": "Employee Lifecycle",
    "description": "Add a new orientation topic with description, location, delivery mode, duration and number of evaluation questions (Kensium: Orientation)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "orientation-topics",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-07",
    "history": [
      {
        "at": "2026-06-07 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-091",
    "name": "Physical Resources",
    "type": "setting",
    "targetModule": "Asset Management",
    "description": "Add a new physical resource with type, location, capacity and contact details (Kensium: Orientation)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "physical-resources",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-08",
    "history": [
      {
        "at": "2026-06-08 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-092",
    "name": "Presenter Panel",
    "type": "approver-chain",
    "targetModule": "Employee Lifecycle",
    "description": "Add a new presenter panel with description, locations and topics (Kensium: Orientation)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-09",
    "history": [
      {
        "at": "2026-06-09 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-093",
    "name": "Question Bank",
    "type": "setting",
    "targetModule": "Employee Lifecycle",
    "description": "Add a new question with options, answer, location and topic (Kensium: Orientation)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "question-bank",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-10",
    "history": [
      {
        "at": "2026-06-10 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-094",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Employee Lifecycle",
    "description": "Enable or disable the Orientation Module (Kensium: Orientation)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-11",
    "history": [
      {
        "at": "2026-06-11 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-095",
    "name": "Performance Review Configuration",
    "type": "setting",
    "targetModule": "Employee Lifecycle",
    "description": "Select the KRA & Goals Based review type (Kensium: Performance Review)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "performance-review-configuration",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-12",
    "history": [
      {
        "at": "2026-06-12 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-096",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Employee Lifecycle",
    "description": "Enable the performance review module (Kensium: Performance Review)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-13",
    "history": [
      {
        "at": "2026-06-13 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-097",
    "name": "CheckList Questionnaire",
    "type": "custom-form",
    "targetModule": "Recruitment",
    "description": "Add a new checklist question (Kensium: Recruitment)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "custom-form",
      "fields": [
        {
          "label": "Response",
          "fieldType": "text",
          "required": true
        },
        {
          "label": "Effective date",
          "fieldType": "date",
          "required": false
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-14",
    "history": [
      {
        "at": "2026-06-14 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-098",
    "name": "Email Templates",
    "type": "template",
    "targetModule": "Recruitment",
    "description": "View the list of recruitment email templates (Kensium: Recruitment)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Email Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-15",
    "history": [
      {
        "at": "2026-06-15 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-099",
    "name": "Expense Head",
    "type": "setting",
    "targetModule": "Recruitment",
    "description": "Add a new expense head (Kensium: Recruitment)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "expense-head",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-16",
    "history": [
      {
        "at": "2026-06-16 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-100",
    "name": "Letter Templates",
    "type": "template",
    "targetModule": "Recruitment",
    "description": "View the list of letter templates (Kensium: Recruitment)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Letter Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-17",
    "history": [
      {
        "at": "2026-06-17 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-101",
    "name": "Position Level PayGrade",
    "type": "setting",
    "targetModule": "Positions",
    "description": "Enable position level paygrade support (Kensium: Recruitment)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "position-level-paygrade",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-18",
    "history": [
      {
        "at": "2026-06-18 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-102",
    "name": "Posting Channel",
    "type": "setting",
    "targetModule": "Recruitment",
    "description": "Add a new posting channel (Kensium: Recruitment)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "posting-channel",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-19",
    "history": [
      {
        "at": "2026-06-19 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-103",
    "name": "Posting Source Approvers",
    "type": "approver-chain",
    "targetModule": "Recruitment",
    "description": "Add a new posting source approver (Kensium: Recruitment)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-20",
    "history": [
      {
        "at": "2026-06-20 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-104",
    "name": "Pre Joining HR Approvers",
    "type": "approver-chain",
    "targetModule": "Recruitment",
    "description": "Add a pre joining HR approver (Kensium: Recruitment)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-21",
    "history": [
      {
        "at": "2026-06-21 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-105",
    "name": "Pre Joining Network Approvers",
    "type": "approver-chain",
    "targetModule": "Recruitment",
    "description": "Add a pre joining network approver (Kensium: Recruitment)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-22",
    "history": [
      {
        "at": "2026-06-22 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-106",
    "name": "Pre-Interview Questionnaire",
    "type": "custom-form",
    "targetModule": "Recruitment",
    "description": "Add a new pre-interview question (Kensium: Recruitment)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "custom-form",
      "fields": [
        {
          "label": "Response",
          "fieldType": "text",
          "required": true
        },
        {
          "label": "Effective date",
          "fieldType": "date",
          "required": false
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-23",
    "history": [
      {
        "at": "2026-06-23 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-107",
    "name": "Recruiter Strengths",
    "type": "setting",
    "targetModule": "Recruitment",
    "description": "Add new recruiter strengths (Kensium: Recruitment)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "recruiter-strengths",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-24",
    "history": [
      {
        "at": "2026-06-24 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-108",
    "name": "Reference Check",
    "type": "setting",
    "targetModule": "Recruitment",
    "description": "Indicate whether employee reference checks are performed in house (Kensium: Recruitment)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "reference-check",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-25",
    "history": [
      {
        "at": "2026-06-25 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-109",
    "name": "Rehire Settings",
    "type": "setting",
    "targetModule": "Recruitment",
    "description": "Configure which personal and contact detail fields carry over on rehire (Kensium: Recruitment)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "rehire-settings",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-26",
    "history": [
      {
        "at": "2026-06-26 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-110",
    "name": "Required Candidate Documents",
    "type": "setting",
    "targetModule": "Recruitment",
    "description": "Enable setting up required documents at different recruitment stages (Kensium: Recruitment)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "required-candidate-documents",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-27",
    "history": [
      {
        "at": "2026-06-27 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-111",
    "name": "Resource Requisition Approvers",
    "type": "approver-chain",
    "targetModule": "Recruitment",
    "description": "Add a new resource requisition approver (Kensium: Recruitment)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-28",
    "history": [
      {
        "at": "2026-06-28 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-112",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Recruitment",
    "description": "Enable or disable the recruitment module (Kensium: Recruitment)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-01",
    "history": [
      {
        "at": "2026-06-01 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-113",
    "name": "Talent Pool Email",
    "type": "setting",
    "targetModule": "Recruitment",
    "description": "Indicate that an email id is set up to accept job applications (Kensium: Recruitment)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "talent-pool-email",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-02",
    "history": [
      {
        "at": "2026-06-02 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-114",
    "name": "Vacancy Assignment Method",
    "type": "setting",
    "targetModule": "Recruitment",
    "description": "Select the Manual vacancy assignment method (Kensium: Recruitment)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "vacancy-assignment-method",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-03",
    "history": [
      {
        "at": "2026-06-03 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-115",
    "name": "Client Master",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Add a new client with name, creation date, billable flag, email and address (Kensium: Resource Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "client-master",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-04",
    "history": [
      {
        "at": "2026-06-04 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-116",
    "name": "Escalation Custom Fields",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Add a new custom field with a custom value and associated escalation matrix (Kensium: Resource Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "escalation-custom-fields",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-05",
    "history": [
      {
        "at": "2026-06-05 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-117",
    "name": "Escalation Matrix",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Add a new escalation matrix with a matrix name and associated email ids (Kensium: Resource Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "escalation-matrix",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-06",
    "history": [
      {
        "at": "2026-06-06 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-118",
    "name": "Resource Management Settings",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Enable notifying the project admin when a project is closed and set how many days before closure to notify (Kensium: Resource Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "resource-management-settings",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-07",
    "history": [
      {
        "at": "2026-06-07 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-119",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Enable or disable the resource management module (Kensium: Resource Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-08",
    "history": [
      {
        "at": "2026-06-08 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-120",
    "name": "Survey Questions",
    "type": "custom-form",
    "targetModule": "Employees",
    "description": "Enable the survey and set a survey title (Kensium: Resource Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "custom-form",
      "fields": [
        {
          "label": "Response",
          "fieldType": "text",
          "required": true
        },
        {
          "label": "Effective date",
          "fieldType": "date",
          "required": false
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-09",
    "history": [
      {
        "at": "2026-06-09 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-121",
    "name": "Wrike Integration",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Access the Wrike Integration configuration screen (Kensium: Resource Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "wrike-integration",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-10",
    "history": [
      {
        "at": "2026-06-10 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-122",
    "name": "Salary Revision Approvers",
    "type": "approver-chain",
    "targetModule": "Employees",
    "description": "View the list of salary revision approvers with their template name, period basis, location, departments and approvers (Kensium: Salary Revision)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-11",
    "history": [
      {
        "at": "2026-06-11 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-123",
    "name": "Salary Revision Questionnaire",
    "type": "custom-form",
    "targetModule": "Employees",
    "description": "View the list of salary revision questions with their type, options, specificity and mandatory flag (Kensium: Salary Revision)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "custom-form",
      "fields": [
        {
          "label": "Response",
          "fieldType": "text",
          "required": true
        },
        {
          "label": "Effective date",
          "fieldType": "date",
          "required": false
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-12",
    "history": [
      {
        "at": "2026-06-12 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-124",
    "name": "Manage Active Directory",
    "type": "setting",
    "targetModule": "Authentication",
    "description": "Enable or disable Active Directory integration (Kensium: Security)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "manage-active-directory",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-13",
    "history": [
      {
        "at": "2026-06-13 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-125",
    "name": "Password Policy",
    "type": "setting",
    "targetModule": "Roles & Security",
    "description": "Set the number of days after which a password expires (Kensium: Security)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "password-policy",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-14",
    "history": [
      {
        "at": "2026-06-14 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-126",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Feedback & Grievance",
    "description": "Enable or disable the Survey Module using a Yes/No option (Kensium: Surveys)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-15",
    "history": [
      {
        "at": "2026-06-15 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-127",
    "name": "Survey Approvers",
    "type": "approver-chain",
    "targetModule": "Feedback & Grievance",
    "description": "Add a new survey approver (Kensium: Surveys)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-16",
    "history": [
      {
        "at": "2026-06-16 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-128",
    "name": "Survey List",
    "type": "setting",
    "targetModule": "Feedback & Grievance",
    "description": "Add a new survey (Kensium: Surveys)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "survey-list",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-17",
    "history": [
      {
        "at": "2026-06-17 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-129",
    "name": "Categories",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Add a new tax deduction category (Kensium: Tax Planning - Finance)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "categories",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-18",
    "history": [
      {
        "at": "2026-06-18 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-130",
    "name": "Deductions",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Add a new deduction (Kensium: Tax Planning - Finance)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "deductions",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-19",
    "history": [
      {
        "at": "2026-06-19 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-131",
    "name": "Food Allowance",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Add a food allowance with applicable employees and an amount (Kensium: Tax Planning - Finance)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "food-allowance",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-20",
    "history": [
      {
        "at": "2026-06-20 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-132",
    "name": "Income Tax Slabs",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Add an income tax slab with a range and rate (Kensium: Tax Planning - Finance)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "income-tax-slabs",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-21",
    "history": [
      {
        "at": "2026-06-21 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-133",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Enable or disable Tax Planning (Kensium: Tax Planning - Finance)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-22",
    "history": [
      {
        "at": "2026-06-22 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-134",
    "name": "Tax Planning Configuration",
    "type": "setting",
    "targetModule": "Employees",
    "description": "Set the deadline for employees to declare investment details as days after the start of the financial year (Kensium: Tax Planning - Finance)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "tax-planning-configuration",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-23",
    "history": [
      {
        "at": "2026-06-23 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-135",
    "name": "Email Templates — Asset Email Template",
    "type": "template",
    "targetModule": "Notifications",
    "description": "View the list of asset email templates with their type, description and task (Kensium: Templates)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Email Templates — Asset Email Template body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-24",
    "history": [
      {
        "at": "2026-06-24 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-136",
    "name": "Email Templates — Feedback Email Template",
    "type": "template",
    "targetModule": "Notifications",
    "description": "View the feedback and grievance email template list (Kensium: Templates)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Email Templates — Feedback Email Template body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-25",
    "history": [
      {
        "at": "2026-06-25 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-137",
    "name": "Email Templates — Finance Email Templates",
    "type": "template",
    "targetModule": "Notifications",
    "description": "View the finance email templates list (Kensium: Templates)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Email Templates — Finance Email Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-26",
    "history": [
      {
        "at": "2026-06-26 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-138",
    "name": "Email Templates — Performance Management Email Template",
    "type": "template",
    "targetModule": "Notifications",
    "description": "View the performance management email templates list (Kensium: Templates)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Email Templates — Performance Management Email Template body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-27",
    "history": [
      {
        "at": "2026-06-27 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-139",
    "name": "Email Templates — Resource Management Email Template",
    "type": "template",
    "targetModule": "Notifications",
    "description": "View the resource management email templates list (Kensium: Templates)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Email Templates — Resource Management Email Template body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-28",
    "history": [
      {
        "at": "2026-06-28 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-140",
    "name": "Email Templates — Survey Email Template",
    "type": "template",
    "targetModule": "Notifications",
    "description": "View the survey email template list (Kensium: Templates)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Email Templates — Survey Email Template body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-01",
    "history": [
      {
        "at": "2026-06-01 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-141",
    "name": "Email Templates — Time Sheet Management Email Templates",
    "type": "template",
    "targetModule": "Notifications",
    "description": "View the timesheet management email templates list (Kensium: Templates)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Email Templates — Time Sheet Management Email Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-02",
    "history": [
      {
        "at": "2026-06-02 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-142",
    "name": "Email Templates — Training Email Template",
    "type": "template",
    "targetModule": "Notifications",
    "description": "View the training email templates list (Kensium: Templates)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Email Templates — Training Email Template body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-03",
    "history": [
      {
        "at": "2026-06-03 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-143",
    "name": "Email Templates — Travel Email Template",
    "type": "template",
    "targetModule": "Notifications",
    "description": "View the travel management email templates list (Kensium: Templates)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Email Templates — Travel Email Template body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-04",
    "history": [
      {
        "at": "2026-06-04 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-144",
    "name": "Notification Templates — Asset Notification Templates",
    "type": "template",
    "targetModule": "Notifications",
    "description": "View the asset notification templates list (Kensium: Templates)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Notification Templates — Asset Notification Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-05",
    "history": [
      {
        "at": "2026-06-05 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-145",
    "name": "Notification Templates — Feedback Notification Templates",
    "type": "template",
    "targetModule": "Notifications",
    "description": "View the feedback and grievance notification template list (Kensium: Templates)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Notification Templates — Feedback Notification Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-06",
    "history": [
      {
        "at": "2026-06-06 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-146",
    "name": "Notification Templates — Performance Management Notification Template",
    "type": "template",
    "targetModule": "Notifications",
    "description": "View the performance management notification templates list (Kensium: Templates)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Notification Templates — Performance Management Notification Template body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-07",
    "history": [
      {
        "at": "2026-06-07 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-147",
    "name": "Notification Templates — Resource Management Notification Template",
    "type": "template",
    "targetModule": "Notifications",
    "description": "View the resource management notification templates list (Kensium: Templates)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Notification Templates — Resource Management Notification Template body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-08",
    "history": [
      {
        "at": "2026-06-08 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-148",
    "name": "Notification Templates — Survey Notification Template",
    "type": "template",
    "targetModule": "Notifications",
    "description": "View the survey notification template list (Kensium: Templates)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Notification Templates — Survey Notification Template body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-09",
    "history": [
      {
        "at": "2026-06-09 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-149",
    "name": "Notification Templates — Time Sheet Management Notification Templates",
    "type": "template",
    "targetModule": "Notifications",
    "description": "View the timesheet management notification templates list (Kensium: Templates)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Notification Templates — Time Sheet Management Notification Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-10",
    "history": [
      {
        "at": "2026-06-10 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-150",
    "name": "Notification Templates — Training Notification Template",
    "type": "template",
    "targetModule": "Notifications",
    "description": "View the training notification templates list (Kensium: Templates)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Notification Templates — Training Notification Template body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-11",
    "history": [
      {
        "at": "2026-06-11 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-151",
    "name": "Notification Templates — Travel Notification Templates",
    "type": "template",
    "targetModule": "Notifications",
    "description": "View the travel management notification templates list (Kensium: Templates)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Notification Templates — Travel Notification Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-12",
    "history": [
      {
        "at": "2026-06-12 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-152",
    "name": "Notification Templates",
    "type": "template",
    "targetModule": "Notifications",
    "description": "View the recruitment and onboarding notification templates list (Kensium: Templates)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Notification Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-13",
    "history": [
      {
        "at": "2026-06-13 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-153",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Time & Attendance",
    "description": "Enable or disable the timesheet module (Kensium: Time Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-14",
    "history": [
      {
        "at": "2026-06-14 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-154",
    "name": "Short Time Settings",
    "type": "setting",
    "targetModule": "Time & Attendance",
    "description": "Add a short time entry (Kensium: Time Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "short-time-settings",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-15",
    "history": [
      {
        "at": "2026-06-15 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-155",
    "name": "Timesheet Settings",
    "type": "setting",
    "targetModule": "Time & Attendance",
    "description": "Set the day from which an employee timesheet should be visible and the number of previous weekends shown by default (Kensium: Time Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "timesheet-settings",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-16",
    "history": [
      {
        "at": "2026-06-16 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-156",
    "name": "Type Of Work Settings",
    "type": "setting",
    "targetModule": "Time & Attendance",
    "description": "Add a type of work (Kensium: Time Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "type-of-work-settings",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-17",
    "history": [
      {
        "at": "2026-06-17 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-157",
    "name": "Email Templates",
    "type": "template",
    "targetModule": "Leave Management",
    "description": "View the list of leave email templates showing template type ID, email type, and description (Kensium: Time Off - Leave)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Email Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-18",
    "history": [
      {
        "at": "2026-06-18 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-158",
    "name": "FMLA Approvers",
    "type": "approver-chain",
    "targetModule": "Leave Management",
    "description": "Add new FMLA approver(s) (Kensium: Time Off - Leave)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-19",
    "history": [
      {
        "at": "2026-06-19 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-159",
    "name": "FMLA Qualifying Reasons",
    "type": "setting",
    "targetModule": "Leave Management",
    "description": "Add a new FMLA qualifying reason (Kensium: Time Off - Leave)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "fmla-qualifying-reasons",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-20",
    "history": [
      {
        "at": "2026-06-20 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-160",
    "name": "FMLA Rejection Reasons",
    "type": "setting",
    "targetModule": "Leave Management",
    "description": "Add a new FMLA rejection reason (Kensium: Time Off - Leave)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "fmla-rejection-reasons",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-21",
    "history": [
      {
        "at": "2026-06-21 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-161",
    "name": "Holiday Calendar",
    "type": "setting",
    "targetModule": "Leave Management",
    "description": "Add a new holiday calendar (Kensium: Time Off - Leave)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "holiday-calendar",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-22",
    "history": [
      {
        "at": "2026-06-22 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-162",
    "name": "Notification Templates",
    "type": "template",
    "targetModule": "Leave Management",
    "description": "View the list of leave notification templates showing notification type and description (Kensium: Time Off - Leave)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "template",
      "body": "Dear {{employeeName}},\n\n[Notification Templates body — edit in the engine]\n\nRegards,\nHR Team"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-23",
    "history": [
      {
        "at": "2026-06-23 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-163",
    "name": "Paid Time Off",
    "type": "setting",
    "targetModule": "Leave Management",
    "description": "Add a new paid time off type (Kensium: Time Off - Leave)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "paid-time-off",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-24",
    "history": [
      {
        "at": "2026-06-24 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-164",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Leave Management",
    "description": "Enable or disable the time off management module using a Yes/No option (Kensium: Time Off - Leave)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-25",
    "history": [
      {
        "at": "2026-06-25 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-165",
    "name": "Time Off Adjustment Approvers",
    "type": "approver-chain",
    "targetModule": "Leave Management",
    "description": "Add a new time off adjustment approver (Kensium: Time Off - Leave)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-26",
    "history": [
      {
        "at": "2026-06-26 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-166",
    "name": "Time Off Management",
    "type": "setting",
    "targetModule": "Leave Management",
    "description": "View time off management settings per employee class showing the calculation start month (Kensium: Time Off - Leave)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "time-off-management",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-27",
    "history": [
      {
        "at": "2026-06-27 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-167",
    "name": "Unpaid Time Off",
    "type": "setting",
    "targetModule": "Leave Management",
    "description": "Add a new unpaid time off type (Kensium: Time Off - Leave)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "unpaid-time-off",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-28",
    "history": [
      {
        "at": "2026-06-28 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-168",
    "name": "Expense Head",
    "type": "setting",
    "targetModule": "Self Service",
    "description": "Add a new expense head (Kensium: Travel Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "expense-head",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-01",
    "history": [
      {
        "at": "2026-06-01 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-169",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Self Service",
    "description": "Enable or disable the travel management module (Kensium: Travel Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-02",
    "history": [
      {
        "at": "2026-06-02 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-170",
    "name": "Travel Modes",
    "type": "setting",
    "targetModule": "Self Service",
    "description": "Add a new travel mode (Kensium: Travel Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "travel-modes",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-03",
    "history": [
      {
        "at": "2026-06-03 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-171",
    "name": "Travel Request Approvers",
    "type": "approver-chain",
    "targetModule": "Self Service",
    "description": "Add new travel request approvers (Kensium: Travel Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-04",
    "history": [
      {
        "at": "2026-06-04 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-172",
    "name": "Travel Request Expense Approvers",
    "type": "approver-chain",
    "targetModule": "Self Service",
    "description": "Add new travel request expense approvers (Kensium: Travel Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "approver-chain",
      "steps": [
        {
          "order": 1,
          "approverRole": "Reporting Manager",
          "slaHours": 24
        },
        {
          "order": 2,
          "approverRole": "HR Director",
          "slaHours": 48
        }
      ]
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-05",
    "history": [
      {
        "at": "2026-06-05 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-173",
    "name": "Travel Vendors",
    "type": "setting",
    "targetModule": "Self Service",
    "description": "Add a new travel vendor (Kensium: Travel Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "travel-vendors",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-06",
    "history": [
      {
        "at": "2026-06-06 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  },
  {
    "id": "kx-174",
    "name": "Setup",
    "type": "setting",
    "targetModule": "Recruitment",
    "description": "Enable or disable Vendor Management by selecting Yes or No (Kensium: Vendor Management)",
    "version": 1,
    "scopes": {
      "platform": true,
      "portfolio": true,
      "group": true,
      "company": true
    },
    "definition": {
      "kind": "setting",
      "key": "setup",
      "value": "Enabled"
    },
    "updatedBy": "Platform Ops",
    "updatedAt": "2026-06-07",
    "history": [
      {
        "at": "2026-06-07 09:00",
        "actor": "Platform Ops",
        "event": "Imported from Kensium HR catalog — enabled at all scopes"
      }
    ]
  }
] as Artifact[]
