import { z } from 'zod'
import { ENTITY_TYPES } from '../data/documents'

/** Metadata schema for the upload/edit form (file checks run separately
 * against the governed upload policy). */
export const uploadFormSchema = z.object({
  name: z.string().min(2, 'Document name is required'),
  entityType: z.enum(ENTITY_TYPES),
  entityName: z.string().min(2, 'Entity name is required'),
  company: z.string().min(1, 'Select a company'),
  category: z.string().min(1, 'Select a category'),
  documentType: z.string().min(1, 'Select a document type'),
  expiryDate: z.string(),
})

export type UploadFormValues = z.infer<typeof uploadFormSchema>
