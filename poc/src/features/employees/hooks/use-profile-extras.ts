import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedAvatar,
  seedClientFeedback,
  seedContactInfo,
  seedEducation,
  seedEmergencyContacts,
  seedLanguages,
  seedPlaceOfBirth,
  seedSkills,
  seedWorkExperience,
  type ClientFeedbackDraft,
  type ClientFeedbackEntry,
  type ContactInfo,
  type EducationDraft,
  type EducationEntry,
  type EmergencyContact,
  type EmergencyContactDraft,
  type LanguageDraft,
  type LanguageEntry,
  type ProfileAvatar,
  type SkillDraft,
  type SkillEntry,
  type WorkExperienceDraft,
  type WorkExperienceEntry,
} from '../data/profile-extras'

/**
 * In-memory store for the employee self-service profile extras — education,
 * work experience, skills & certifications, client feedback, languages, place
 * of birth and the mock profile photo. Mirrors the employees store pattern;
 * state resets on reload (no backend in the POC).
 */
export function useProfileExtras() {
  const [education, setEducation] = useState<EducationEntry[]>(seedEducation)
  const [workExperience, setWorkExperience] =
    useState<WorkExperienceEntry[]>(seedWorkExperience)
  const [skills, setSkills] = useState<SkillEntry[]>(seedSkills)
  const [clientFeedback, setClientFeedback] =
    useState<ClientFeedbackEntry[]>(seedClientFeedback)
  const [languages, setLanguages] = useState<LanguageEntry[]>(seedLanguages)
  const [placeOfBirth, setPlaceOfBirth] = useState(seedPlaceOfBirth)
  const [avatar, setAvatar] = useState<ProfileAvatar>(seedAvatar)
  const [contactInfo, setContactInfo] = useState<ContactInfo>(seedContactInfo)
  const [emergencyContacts, setEmergencyContacts] = useState<
    EmergencyContact[]
  >(seedEmergencyContacts)

  // --- Education -----------------------------------------------------------
  const addEducation = useCallback((draft: EducationDraft) => {
    setEducation((prev) => [
      ...prev,
      { ...draft, id: `edu-${crypto.randomUUID().slice(0, 6)}` },
    ])
    toast.success(`${draft.education} added to your education history`)
  }, [])

  const updateEducation = useCallback((id: string, draft: EducationDraft) => {
    setEducation((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...draft } : e))
    )
    toast.success('Education entry updated')
  }, [])

  const removeEducation = useCallback((id: string) => {
    setEducation((prev) => prev.filter((e) => e.id !== id))
    toast.success('Education entry removed')
  }, [])

  // --- Work experience -----------------------------------------------------
  const addWorkExperience = useCallback((draft: WorkExperienceDraft) => {
    setWorkExperience((prev) => [
      ...prev,
      { ...draft, id: `we-${crypto.randomUUID().slice(0, 6)}` },
    ])
    toast.success(`${draft.employerName} added to your work experience`)
  }, [])

  const updateWorkExperience = useCallback(
    (id: string, draft: WorkExperienceDraft) => {
      setWorkExperience((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...draft } : e))
      )
      toast.success('Work experience updated')
    },
    []
  )

  const removeWorkExperience = useCallback((id: string) => {
    setWorkExperience((prev) => prev.filter((e) => e.id !== id))
    toast.success('Work experience removed')
  }, [])

  // --- Skills & certifications ---------------------------------------------
  const addSkill = useCallback((draft: SkillDraft) => {
    setSkills((prev) => [
      ...prev,
      { ...draft, id: `sk-${crypto.randomUUID().slice(0, 6)}` },
    ])
    toast.success(`${draft.skillTechnology} added to your skills`)
  }, [])

  const updateSkill = useCallback((id: string, draft: SkillDraft) => {
    setSkills((prev) => prev.map((e) => (e.id === id ? { ...e, ...draft } : e)))
    toast.success('Skill updated')
  }, [])

  const removeSkill = useCallback((id: string) => {
    setSkills((prev) => prev.filter((e) => e.id !== id))
    toast.success('Skill removed')
  }, [])

  // --- Client feedback -----------------------------------------------------
  const addClientFeedback = useCallback((draft: ClientFeedbackDraft) => {
    setClientFeedback((prev) => [
      ...prev,
      { ...draft, id: `cf-${crypto.randomUUID().slice(0, 6)}` },
    ])
    toast.success(`Feedback from ${draft.clientName} recorded`)
  }, [])

  const updateClientFeedback = useCallback(
    (id: string, draft: ClientFeedbackDraft) => {
      setClientFeedback((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...draft } : e))
      )
      toast.success('Client feedback updated')
    },
    []
  )

  const removeClientFeedback = useCallback((id: string) => {
    setClientFeedback((prev) => prev.filter((e) => e.id !== id))
    toast.success('Client feedback removed')
  }, [])

  // --- Languages -----------------------------------------------------------
  const addLanguage = useCallback((draft: LanguageDraft) => {
    setLanguages((prev) => [
      ...prev,
      { ...draft, id: `lang-${crypto.randomUUID().slice(0, 6)}` },
    ])
    toast.success(`${draft.language} added to your languages`)
  }, [])

  const removeLanguage = useCallback((id: string) => {
    setLanguages((prev) => prev.filter((e) => e.id !== id))
    toast.success('Language removed')
  }, [])

  // --- Contact & address -----------------------------------------------------
  const updateContactInfo = useCallback((next: ContactInfo) => {
    setContactInfo(next)
    toast.success('Contact & address details updated')
  }, [])

  // --- Emergency contacts ----------------------------------------------------
  const addEmergencyContact = useCallback((draft: EmergencyContactDraft) => {
    setEmergencyContacts((prev) => [
      ...prev,
      { ...draft, id: `ec-${crypto.randomUUID().slice(0, 6)}` },
    ])
    toast.success(`${draft.name} added as an emergency contact`)
  }, [])

  const updateEmergencyContact = useCallback(
    (id: string, draft: EmergencyContactDraft) => {
      setEmergencyContacts((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...draft } : e))
      )
      toast.success('Emergency contact updated')
    },
    []
  )

  const removeEmergencyContact = useCallback((id: string) => {
    setEmergencyContacts((prev) => prev.filter((e) => e.id !== id))
    toast.success('Emergency contact removed')
  }, [])

  // --- Personal info extras --------------------------------------------------
  const updateAvatar = useCallback((next: ProfileAvatar) => {
    setAvatar(next)
    toast.success('Profile photo updated')
  }, [])

  return {
    education,
    workExperience,
    skills,
    clientFeedback,
    languages,
    placeOfBirth,
    avatar,
    contactInfo,
    emergencyContacts,
    addEducation,
    updateEducation,
    removeEducation,
    addWorkExperience,
    updateWorkExperience,
    removeWorkExperience,
    addSkill,
    updateSkill,
    removeSkill,
    addClientFeedback,
    updateClientFeedback,
    removeClientFeedback,
    addLanguage,
    removeLanguage,
    setPlaceOfBirth,
    updateAvatar,
    updateContactInfo,
    addEmergencyContact,
    updateEmergencyContact,
    removeEmergencyContact,
  }
}

export type ProfileExtrasStore = ReturnType<typeof useProfileExtras>
