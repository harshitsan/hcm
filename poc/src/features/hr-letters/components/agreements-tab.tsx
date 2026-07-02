import { useMemo, useState } from 'react'
import { PaperPlaneTilt, PencilSimple, Plus, Trash } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AGREEMENT_TYPES,
  EMPLOYEES,
  type LetterTemplate,
} from '../data/hr-letters'
import { type CatalogsStore } from '../hooks/use-catalogs'
import { type HrDocumentsStore } from '../hooks/use-hr-documents'
import {
  type LetterTemplatesStore,
  type TemplateDraft,
} from '../hooks/use-letter-templates'
import {
  AgreementAnswersDialog,
  IssueAgreementDialog,
} from './agreement-dialogs'
import { AckBadge } from './status-badges'
import { TemplateOverlay } from './template-overlay'

interface AgreementsTabProps {
  templatesStore: LetterTemplatesStore
  documentsStore: HrDocumentsStore
  catalogs: CatalogsStore
}

/**
 * Agreement letters (HLC-28/30): binding templates (Certification / Training
 * Agreement) that require employee acknowledgment, the certification
 * questionnaire configured alongside them, and an outstanding-acknowledgment
 * tracker with the captured questionnaire responses (HLC-29).
 */
export function AgreementsTab({
  templatesStore,
  documentsStore,
  catalogs,
}: AgreementsTabProps) {
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [editing, setEditing] = useState<LetterTemplate | null>(null)
  const [issuing, setIssuing] = useState<LetterTemplate | null>(null)
  const [newQuestion, setNewQuestion] = useState('')
  const [viewingAnswersId, setViewingAnswersId] = useState<string | null>(null)

  const agreementTemplates = useMemo(
    () =>
      templatesStore.templates.filter((t) =>
        (AGREEMENT_TYPES as readonly string[]).includes(t.docType)
      ),
    [templatesStore.templates]
  )

  const agreementDocs = useMemo(
    () => documentsStore.documents.filter((d) => d.requiresAcknowledgment),
    [documentsStore.documents]
  )
  const outstanding = agreementDocs.filter((d) => !d.acknowledgedOn).length
  const viewingAnswers = agreementDocs.find((d) => d.id === viewingAnswersId)

  const handleSubmit = (draft: TemplateDraft) => {
    if (editing)
      templatesStore.updateTemplate(editing.id, draft, 'Lakshmi Rao (Company Admin)')
    else templatesStore.addTemplate(draft, 'Lakshmi Rao (Company Admin)')
    setEditing(null)
  }

  const issueAgreement = (employeeId: string) => {
    const employee = EMPLOYEES.find((e) => e.id === employeeId)
    if (!issuing || !employee) return
    documentsStore.generate(
      issuing,
      [employee],
      'manual',
      issuing.docType === 'Certification Agreement Letter'
        ? 'Certification sponsorship'
        : 'Training nomination',
      'Lakshmi Rao (Company Admin)'
    )
    setIssuing(null)
  }

  return (
    <div className='w-full'>
      <Tabs defaultValue='templates' className='w-full'>
        <TabsList className='mb-3 bg-transparent p-0'>
          <TabsTrigger variant='primary' value='templates'>
            Letter Templates
          </TabsTrigger>
          <TabsTrigger variant='primary' value='questionnaire'>
            Certification Questionnaire
          </TabsTrigger>
          <TabsTrigger variant='primary' value='acknowledgments'>
            Acknowledgments ({outstanding} outstanding)
          </TabsTrigger>
        </TabsList>

        <TabsContent value='templates'>
          <div className='mb-3 flex items-center justify-between'>
            <p className='text-paragraph-sm text-neutral-1000'>
              Agreement letters require employee acknowledgment/signature
              before they are considered complete — distinct from
              informational letters.
            </p>
            <Button
              variant='red'
              onClick={() => {
                setEditing(null)
                setOverlayOpen(true)
              }}
              className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
            >
              <Plus size={10} weight='bold' />
              New agreement template
            </Button>
          </div>
          <div className='rounded-[6px] border border-gray-200 bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Agreement type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Acknowledgment</TableHead>
                  <TableHead className='text-right'>Task</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agreementTemplates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className='font-medium'>{t.name}</TableCell>
                    <TableCell>{t.docType}</TableCell>
                    <TableCell>
                      <Badge variant='pending'>v{t.currentVersion}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant='open'>Signature required</Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex justify-end gap-1'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => setIssuing(t)}
                        >
                          <PaperPlaneTilt size={14} weight='bold' /> Issue
                        </Button>
                        <Button
                          variant='icon2'
                          className='text-neutral-1900 h-7 w-7'
                          aria-label='Edit'
                          onClick={() => {
                            setEditing(t)
                            setOverlayOpen(true)
                          }}
                        >
                          <PencilSimple size={14} weight='fill' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value='questionnaire'>
          <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
            <p className='text-paragraph-sm text-neutral-1000 mb-3'>
              These questions are presented with every certification agreement;
              the employee’s answers are captured against the agreement record.
            </p>
            <ul className='mb-3 space-y-2'>
              {catalogs.questions.map((q) => (
                <li key={q.id} className='flex items-center gap-2 text-sm'>
                  <Badge variant={q.required ? 'open' : 'pending'}>
                    {q.required ? 'Required' : 'Optional'}
                  </Badge>
                  <span className='flex-1'>{q.text}</span>
                  <Button
                    variant='icon2'
                    className='text-neutral-1900 h-7 w-7'
                    aria-label='Remove question'
                    onClick={() => catalogs.removeQuestion(q.id)}
                  >
                    <Trash size={14} weight='bold' />
                  </Button>
                </li>
              ))}
            </ul>
            <div className='flex items-center gap-2'>
              <Input
                placeholder='Add a certification question'
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
              />
              <Button
                size='sm'
                disabled={newQuestion.trim().length < 5}
                onClick={() => {
                  catalogs.addQuestion(newQuestion.trim(), true)
                  setNewQuestion('')
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value='acknowledgments'>
          <div className='rounded-[6px] border border-gray-200 bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Responses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agreementDocs.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className='font-medium'>{d.docType}</TableCell>
                    <TableCell>{d.employeeName}</TableCell>
                    <TableCell>{d.generatedOn}</TableCell>
                    <TableCell>
                      <AckBadge acknowledgedOn={d.acknowledgedOn} />
                      {d.acknowledgedOn && (
                        <span className='text-neutral-1000 ml-2 text-xs'>
                          {d.acknowledgedOn}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='text-right'>
                      {d.questionnaireAnswers.length > 0 ? (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => setViewingAnswersId(d.id)}
                        >
                          View answers
                        </Button>
                      ) : (
                        <span className='text-neutral-1000 text-xs'>—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <TemplateOverlay
        open={overlayOpen}
        onOpenChange={(open) => {
          setOverlayOpen(open)
          if (!open) setEditing(null)
        }}
        template={editing}
        agreementOnly
        onSubmit={handleSubmit}
      />

      <IssueAgreementDialog
        issuing={issuing}
        onOpenChange={(open) => !open && setIssuing(null)}
        onIssue={issueAgreement}
      />

      <AgreementAnswersDialog
        doc={viewingAnswers}
        onClose={() => setViewingAnswersId(null)}
      />
    </div>
  )
}
