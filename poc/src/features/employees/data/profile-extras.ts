/**
 * Self-service profile extras (Kensium Employee Profile parity) — education,
 * work experience, skills & certifications, client feedback, languages and
 * the mock profile-photo control. Seeded for the current mock employee
 * (Rohit Menon, e-1003); state lives in use-profile-extras.ts.
 */

export const EDUCATION_TYPES = [
  'Graduation',
  'Post Graduation',
  'Doctorate',
  'Diploma',
  'Schooling',
] as const
export type EducationType = (typeof EDUCATION_TYPES)[number]

export const EDUCATION_MODES = [
  'Full time',
  'Part time',
  'Correspondence',
] as const
export type EducationMode = (typeof EDUCATION_MODES)[number]

export interface EducationEntry {
  id: string
  educationType: EducationType
  education: string
  specialization: string
  universityCollege: string
  yearOfPassing: string
  mode: EducationMode
  startDate: string
  endDate: string
  gpaScore: string
}
export type EducationDraft = Omit<EducationEntry, 'id'>

export interface WorkExperienceEntry {
  id: string
  isCurrentEmployer: boolean
  employerName: string
  fromDate: string
  /** Empty when this is the current employer. */
  toDate: string
  jobTitle: string
  jobLocation: string
  startingCtc: string
  endingCtc: string
  comments: string
}
export type WorkExperienceDraft = Omit<WorkExperienceEntry, 'id'>

export interface SkillEntry {
  id: string
  skillTechnology: string
  experienceYears: number
  /** 1–5 self-assessed proficiency. */
  rating: number
  hasCertification: boolean
  certificateName?: string
  validFrom?: string
  validTo?: string
  isRenewable?: boolean
  remindDaysBefore?: number
  documentName?: string
}
export type SkillDraft = Omit<SkillEntry, 'id'>

export const FEEDBACK_TYPES = ['Positive', 'Negative', 'Neutral'] as const
export type FeedbackType = (typeof FEEDBACK_TYPES)[number]

export interface ClientFeedbackEntry {
  id: string
  clientName: string
  projectName: string
  feedbackDate: string
  subject: string
  feedbackType: FeedbackType
  documentName?: string
  feedbackText: string
}
export type ClientFeedbackDraft = Omit<ClientFeedbackEntry, 'id'>

export interface LanguageEntry {
  id: string
  language: string
  canRead: boolean
  canWrite: boolean
  canSpeak: boolean
}
export type LanguageDraft = Omit<LanguageEntry, 'id'>

export interface ContactInfo {
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  country: string
  pinZip: string
  personalEmail: string
  personalPhone: string
  workEmail: string
  workPhone: string
}

export const EMERGENCY_RELATIONSHIPS = [
  'Spouse',
  'Parent',
  'Sibling',
  'Friend',
  'Other',
] as const
export type EmergencyRelationship = (typeof EMERGENCY_RELATIONSHIPS)[number]

export interface EmergencyContact {
  id: string
  name: string
  relationship: EmergencyRelationship
  phone: string
  email?: string
}
export type EmergencyContactDraft = Omit<EmergencyContact, 'id'>

/** Reference "today" for the certification renewal-reminder window. */
export const CERT_REFERENCE_DATE = '2026-07-09'
export const CERT_EXPIRY_WINDOW_DAYS = 90

/** Mock profile-photo presets — no real upload in the POC. */
export interface AvatarPreset {
  id: string
  label: string
  className: string
}
export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'blue', label: 'Blue', className: 'bg-blue-150 text-blue-1400' },
  { id: 'orange', label: 'Orange', className: 'bg-orange-1200 text-white' },
  { id: 'neutral', label: 'Slate', className: 'bg-neutral-200 text-neutral-1600' },
]

export interface ProfileAvatar {
  presetId: string
  /** Optional pasted image URL; takes precedence over the preset. */
  imageUrl: string
}

export const seedAvatar: ProfileAvatar = { presetId: 'blue', imageUrl: '' }

export const seedPlaceOfBirth = 'Kochi, Kerala'

export const seedContactInfo: ContactInfo = {
  addressLine1: 'Flat 402, Lakeview Residency',
  addressLine2: '18th Cross, HSR Layout Sector 2',
  city: 'Bengaluru',
  state: 'Karnataka',
  country: 'India',
  pinZip: '560102',
  personalEmail: 'rohit.menon.87@gmail.com',
  personalPhone: '+91 98450 22187',
  workEmail: 'rohit.menon@aurora.in',
  workPhone: '+91 80 4712 3300',
}

export const seedEmergencyContacts: EmergencyContact[] = [
  {
    id: 'ec-1',
    name: 'Lakshmi Menon',
    relationship: 'Spouse',
    phone: '+91 98861 44502',
    email: 'lakshmi.menon@gmail.com',
  },
  {
    id: 'ec-2',
    name: 'Suresh Menon',
    relationship: 'Parent',
    phone: '+91 94470 18823',
  },
]

export const seedEducation: EducationEntry[] = [
  {
    id: 'edu-1',
    educationType: 'Graduation',
    education: 'B.E. Computer Science',
    specialization: 'Computer Science & Engineering',
    universityCollege: 'Visvesvaraya Technological University',
    yearOfPassing: '2017',
    mode: 'Full time',
    startDate: '2013-08-01',
    endDate: '2017-06-30',
    gpaScore: '8.4 CGPA',
  },
  {
    id: 'edu-2',
    educationType: 'Post Graduation',
    education: 'M.Tech Software Engineering',
    specialization: 'Software Engineering',
    universityCollege: 'BITS Pilani (WILP)',
    yearOfPassing: '2021',
    mode: 'Correspondence',
    startDate: '2019-01-15',
    endDate: '2021-01-10',
    gpaScore: '7.9 CGPA',
  },
]

export const seedWorkExperience: WorkExperienceEntry[] = [
  {
    id: 'we-1',
    isCurrentEmployer: true,
    employerName: 'Aurora Retail Pvt Ltd',
    fromDate: '2021-08-16',
    toDate: '',
    jobTitle: 'Senior Software Engineer',
    jobLocation: 'Bengaluru',
    startingCtc: '18.5 LPA',
    endingCtc: '24.0 LPA',
    comments: 'Platform engineering — storefront and order services.',
  },
  {
    id: 'we-2',
    isCurrentEmployer: false,
    employerName: 'Infoline Systems',
    fromDate: '2017-06-05',
    toDate: '2021-08-06',
    jobTitle: 'Software Engineer',
    jobLocation: 'Pune',
    startingCtc: '4.2 LPA',
    endingCtc: '11.0 LPA',
    comments: 'Full-stack delivery for retail and logistics clients.',
  },
]

export const seedSkills: SkillEntry[] = [
  {
    id: 'sk-1',
    skillTechnology: 'React / TypeScript',
    experienceYears: 5,
    rating: 5,
    hasCertification: true,
    certificateName: 'Meta Front-End Developer',
    validFrom: '2024-08-15',
    validTo: '2026-08-30',
    isRenewable: true,
    remindDaysBefore: 30,
    documentName: 'meta-frontend-certificate.pdf',
  },
  {
    id: 'sk-2',
    skillTechnology: 'AWS',
    experienceYears: 3,
    rating: 4,
    hasCertification: true,
    certificateName: 'AWS Certified Developer — Associate',
    validFrom: '2024-11-20',
    validTo: '2027-11-20',
    isRenewable: true,
    remindDaysBefore: 60,
    documentName: 'aws-dva-certificate.pdf',
  },
  {
    id: 'sk-3',
    skillTechnology: 'PostgreSQL',
    experienceYears: 6,
    rating: 4,
    hasCertification: false,
  },
]

export const seedClientFeedback: ClientFeedbackEntry[] = [
  {
    id: 'cf-1',
    clientName: 'Northwind Retail',
    projectName: 'Storefront Revamp',
    feedbackDate: '2026-03-18',
    subject: 'Checkout performance overhaul',
    feedbackType: 'Positive',
    documentName: 'northwind-appreciation.pdf',
    feedbackText:
      'Rohit led the checkout latency work and cut p95 load time by 40%. Communication through the release window was excellent.',
  },
  {
    id: 'cf-2',
    clientName: 'Zenith Bank',
    projectName: 'Payments Integration',
    feedbackDate: '2025-11-02',
    subject: 'UAT support',
    feedbackType: 'Neutral',
    feedbackText:
      'Deliverables met the agreed scope. Turnaround on defect fixes was acceptable; earlier heads-up on API contract changes would help.',
  },
]

export const seedLanguages: LanguageEntry[] = [
  { id: 'lang-1', language: 'English', canRead: true, canWrite: true, canSpeak: true },
  { id: 'lang-2', language: 'Malayalam', canRead: true, canWrite: true, canSpeak: true },
  { id: 'lang-3', language: 'Kannada', canRead: false, canWrite: false, canSpeak: true },
]
