import type { ColumnDef } from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'

import { getCrmRuntimeConfig } from '../../app/crmConfig'
import {
  createMissionControlTester,
  issueMissionControlAccess,
  listMissionControlTesters,
  updateMissionControlTesterAiQuota,
  updateMissionControlTesterStatus,
} from '../../data/missionControl/missionControlAdminClient'
import type {
  CreatedMissionControlTester,
  MissionControlAiQuotaLimits,
  MissionControlQuotaBucket,
  IssuedMissionControlAccess,
  MissionControlTester,
  MissionControlTesterStatus,
} from '../../data/missionControl/missionControlAdminClient'
import { DataTable } from '../../shared/components/DataTable'
import { PageHeader } from '../../shared/ui/PageHeader'

type GeneratedCode = {
  testerId: string
  name: string
  email: string
  activationCode: string
  accessId: string
}

type FormState = {
  name: string
  email: string
  expiresAt: string
  notes: string
  aiDailyLimit: string
  aiWeeklyLimit: string
  aiActionDailyLimit: string
  aiActionWeeklyLimit: string
  aiSummaryDailyLimit: string
  aiSummaryWeeklyLimit: string
}

const initialFormState: FormState = {
  name: '',
  email: '',
  expiresAt: '',
  notes: '',
  aiDailyLimit: '3',
  aiWeeklyLimit: '10',
  aiActionDailyLimit: '10',
  aiActionWeeklyLimit: '40',
  aiSummaryDailyLimit: '2',
  aiSummaryWeeklyLimit: '10',
}

const statusLabels: Record<MissionControlTesterStatus, string> = {
  ACTIVE: 'Actif',
  REVOKED: 'Revoque',
  EXPIRED: 'Expire',
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getLatestAccess(tester: MissionControlTester) {
  return tester.accesses[0] ?? null
}

function countActivatedTesters(testers: MissionControlTester[]) {
  return testers.filter((tester) =>
    tester.accesses.some((access) => Boolean(access.activatedAt)),
  ).length
}

function countPostsScored(testers: MissionControlTester[]) {
  return testers.reduce(
    (total, tester) =>
      total +
      tester.accesses.reduce(
        (accessTotal, access) => accessTotal + Number(access.postsScored || 0),
        0,
      ),
    0,
  )
}

function getQuotaBucket(
  tester: MissionControlTester,
  key: 'missionEnhancement' | 'signalAction' | 'reportSynthesis',
): MissionControlQuotaBucket {
  const fallbackDailyLimit =
    key === 'signalAction'
      ? tester.aiActionDailyLimit ?? 10
      : key === 'reportSynthesis'
        ? tester.aiSummaryDailyLimit ?? 2
        : tester.aiDailyLimit ?? 3
  const fallbackWeeklyLimit =
    key === 'signalAction'
      ? tester.aiActionWeeklyLimit ?? 40
      : key === 'reportSynthesis'
        ? tester.aiSummaryWeeklyLimit ?? 10
        : tester.aiWeeklyLimit ?? 10

  const quota = tester.aiQuota
  const bucket =
    key === 'missionEnhancement'
      ? quota?.missionEnhancement ?? quota
      : key === 'signalAction'
        ? quota?.signalAction
        : quota?.reportSynthesis

  return {
    daily: bucket?.daily ?? {
      used: 0,
      limit: fallbackDailyLimit,
      remaining: fallbackDailyLimit,
      resetsAt: '',
    },
    weekly: bucket?.weekly ?? {
      used: 0,
      limit: fallbackWeeklyLimit,
      remaining: fallbackWeeklyLimit,
      resetsAt: '',
    },
  }
}

function countAiUnits(
  testers: MissionControlTester[],
  key: 'missionEnhancement' | 'signalAction' | 'reportSynthesis',
) {
  return testers.reduce(
    (total, tester) => total + getQuotaBucket(tester, key).weekly.used,
    0,
  )
}

function getQuotaProgress(period: { used: number; limit: number }) {
  if (period.limit <= 0) {
    return period.used > 0 ? 100 : 0
  }

  return Math.max(0, Math.min(100, Math.round((period.used / period.limit) * 100)))
}

function clampQuotaInput(value: string, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : fallback
}

function makeGeneratedCodeFromTester(tester: CreatedMissionControlTester): GeneratedCode {
  return {
    testerId: tester.id,
    name: tester.name,
    email: tester.email,
    activationCode: tester.activationCode,
    accessId: tester.accessId,
  }
}

function StatusBadge({ status }: { status: MissionControlTesterStatus }) {
  return (
    <span className={`badge beta-status beta-status--${status.toLowerCase()}`}>
      {statusLabels[status] ?? status}
    </span>
  )
}

function AiQuotaEditor({
  tester,
  disabled,
  onSave,
}: {
  tester: MissionControlTester
  disabled: boolean
  onSave: (limits: Required<MissionControlAiQuotaLimits>) => void
}) {
  const missionQuota = getQuotaBucket(tester, 'missionEnhancement')
  const actionQuota = getQuotaBucket(tester, 'signalAction')
  const summaryQuota = getQuotaBucket(tester, 'reportSynthesis')
  const [limits, setLimits] = useState<Required<MissionControlAiQuotaLimits>>({
    aiDailyLimit: tester.aiDailyLimit ?? missionQuota.daily.limit,
    aiWeeklyLimit: tester.aiWeeklyLimit ?? missionQuota.weekly.limit,
    aiActionDailyLimit: tester.aiActionDailyLimit ?? actionQuota.daily.limit,
    aiActionWeeklyLimit: tester.aiActionWeeklyLimit ?? actionQuota.weekly.limit,
    aiSummaryDailyLimit: tester.aiSummaryDailyLimit ?? summaryQuota.daily.limit,
    aiSummaryWeeklyLimit: tester.aiSummaryWeeklyLimit ?? summaryQuota.weekly.limit,
  })

  const isInvalid =
    limits.aiDailyLimit < 0 ||
    limits.aiDailyLimit > 20 ||
    limits.aiWeeklyLimit < 0 ||
    limits.aiWeeklyLimit > 100 ||
    (limits.aiWeeklyLimit > 0 && limits.aiDailyLimit > limits.aiWeeklyLimit) ||
    limits.aiActionDailyLimit < 0 ||
    limits.aiActionDailyLimit > 100 ||
    limits.aiActionWeeklyLimit < 0 ||
    limits.aiActionWeeklyLimit > 500 ||
    (limits.aiActionWeeklyLimit > 0 &&
      limits.aiActionDailyLimit > limits.aiActionWeeklyLimit) ||
    limits.aiSummaryDailyLimit < 0 ||
    limits.aiSummaryDailyLimit > 20 ||
    limits.aiSummaryWeeklyLimit < 0 ||
    limits.aiSummaryWeeklyLimit > 100 ||
    (limits.aiSummaryWeeklyLimit > 0 &&
      limits.aiSummaryDailyLimit > limits.aiSummaryWeeklyLimit)

  function updateLimit(field: keyof MissionControlAiQuotaLimits, value: string) {
    setLimits((current) => ({
      ...current,
      [field]: clampQuotaInput(value, current[field] ?? 0),
    }))
  }

  function applyPreset(preset: Required<MissionControlAiQuotaLimits>) {
    setLimits(preset)
    onSave(preset)
  }

  return (
    <div className="beta-quota-editor">
      <QuotaUsageRow
        label="Mission"
        quota={missionQuota}
        dailyLimit={limits.aiDailyLimit}
        weeklyLimit={limits.aiWeeklyLimit}
      />
      <QuotaUsageRow
        label="Actions"
        quota={actionQuota}
        dailyLimit={limits.aiActionDailyLimit}
        weeklyLimit={limits.aiActionWeeklyLimit}
      />
      <QuotaUsageRow
        label="Synthese"
        quota={summaryQuota}
        dailyLimit={limits.aiSummaryDailyLimit}
        weeklyLimit={limits.aiSummaryWeeklyLimit}
      />

      <div className="beta-quota-limit-grid">
        <QuotaLimitInputs
          dailyLabel="Mission/J"
          dailyMax={20}
          dailyValue={limits.aiDailyLimit}
          weeklyLabel="Mission/S"
          weeklyMax={100}
          weeklyValue={limits.aiWeeklyLimit}
          testerName={tester.name}
          onDailyChange={(value) => updateLimit('aiDailyLimit', value)}
          onWeeklyChange={(value) => updateLimit('aiWeeklyLimit', value)}
        />
        <QuotaLimitInputs
          dailyLabel="Actions/J"
          dailyMax={100}
          dailyValue={limits.aiActionDailyLimit}
          weeklyLabel="Actions/S"
          weeklyMax={500}
          weeklyValue={limits.aiActionWeeklyLimit}
          testerName={tester.name}
          onDailyChange={(value) => updateLimit('aiActionDailyLimit', value)}
          onWeeklyChange={(value) => updateLimit('aiActionWeeklyLimit', value)}
        />
        <QuotaLimitInputs
          dailyLabel="Synth./J"
          dailyMax={20}
          dailyValue={limits.aiSummaryDailyLimit}
          weeklyLabel="Synth./S"
          weeklyMax={100}
          weeklyValue={limits.aiSummaryWeeklyLimit}
          testerName={tester.name}
          onDailyChange={(value) => updateLimit('aiSummaryDailyLimit', value)}
          onWeeklyChange={(value) => updateLimit('aiSummaryWeeklyLimit', value)}
        />
      </div>

      <div className="beta-quota-presets">
        <button
          className="button button--secondary"
          disabled={disabled}
          onClick={() =>
            applyPreset({
              aiDailyLimit: 3,
              aiWeeklyLimit: 10,
              aiActionDailyLimit: 10,
              aiActionWeeklyLimit: 40,
              aiSummaryDailyLimit: 2,
              aiSummaryWeeklyLimit: 10,
            })
          }
          type="button"
        >
          Standard
        </button>
        <button
          className="button button--secondary"
          disabled={disabled}
          onClick={() =>
            applyPreset({
              aiDailyLimit: 5,
              aiWeeklyLimit: 20,
              aiActionDailyLimit: 25,
              aiActionWeeklyLimit: 100,
              aiSummaryDailyLimit: 4,
              aiSummaryWeeklyLimit: 20,
            })
          }
          type="button"
        >
          Power
        </button>
        <button
          className="button button--secondary"
          disabled={disabled}
          onClick={() =>
            applyPreset({
              aiDailyLimit: 0,
              aiWeeklyLimit: 0,
              aiActionDailyLimit: 0,
              aiActionWeeklyLimit: 0,
              aiSummaryDailyLimit: 0,
              aiSummaryWeeklyLimit: 0,
            })
          }
          type="button"
        >
          Pause IA
        </button>
      </div>

      <div className="beta-quota-save">
        <button
          className="button button--secondary"
          disabled={disabled || isInvalid}
          onClick={() => onSave(limits)}
          type="button"
        >
          Appliquer
        </button>
      </div>
    </div>
  )
}

function QuotaUsageRow({
  label,
  quota,
  dailyLimit,
  weeklyLimit,
}: {
  label: string
  quota: MissionControlQuotaBucket
  dailyLimit: number
  weeklyLimit: number
}) {
  const daily = {
    ...quota.daily,
    limit: dailyLimit,
  }
  const weekly = {
    ...quota.weekly,
    limit: weeklyLimit,
  }

  return (
    <div className="beta-quota-row">
      <div className="beta-quota-row-head">
        <strong>{label}</strong>
        <span>
          {weekly.used}/{weekly.limit} semaine
        </span>
      </div>
      <div className="beta-quota-bars" aria-label={`Consommation IA ${label}`}>
        <span
          className="beta-quota-bar"
          style={
            {
              '--quota-progress': `${getQuotaProgress(daily)}%`,
            } as CSSProperties
          }
        >
          <em>Jour</em>
          <b>
            {daily.used}/{daily.limit}
          </b>
        </span>
        <span
          className="beta-quota-bar"
          style={
            {
              '--quota-progress': `${getQuotaProgress(weekly)}%`,
            } as CSSProperties
          }
        >
          <em>Semaine</em>
          <b>
            {weekly.used}/{weekly.limit}
          </b>
        </span>
      </div>
    </div>
  )
}

function QuotaLimitInputs({
  dailyLabel,
  dailyMax,
  dailyValue,
  weeklyLabel,
  weeklyMax,
  weeklyValue,
  testerName,
  onDailyChange,
  onWeeklyChange,
}: {
  dailyLabel: string
  dailyMax: number
  dailyValue: number
  weeklyLabel: string
  weeklyMax: number
  weeklyValue: number
  testerName: string
  onDailyChange: (value: string) => void
  onWeeklyChange: (value: string) => void
}) {
  return (
    <div className="beta-quota-input-pair">
      <label>
        {dailyLabel}
        <input
          aria-label={`${dailyLabel} de ${testerName}`}
          max={dailyMax}
          min={0}
          onChange={(event) => onDailyChange(event.target.value)}
          type="number"
          value={dailyValue}
        />
      </label>
      <label>
        {weeklyLabel}
        <input
          aria-label={`${weeklyLabel} de ${testerName}`}
          max={weeklyMax}
          min={0}
          onChange={(event) => onWeeklyChange(event.target.value)}
          type="number"
          value={weeklyValue}
        />
      </label>
    </div>
  )
}

export function BetaTestersPage() {
  const queryClient = useQueryClient()
  const config = getCrmRuntimeConfig()
  const proxyBaseUrl = config.googleSheetsProxyUrl
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null)
  const [copyStatus, setCopyStatus] = useState('')

  const testersQuery = useQuery({
    queryKey: ['mission-control-testers', proxyBaseUrl],
    queryFn: () => listMissionControlTesters(proxyBaseUrl),
  })

  const createTesterMutation = useMutation({
    mutationFn: () =>
      createMissionControlTester(proxyBaseUrl, {
        name: formState.name,
        email: formState.email,
        expiresAt: formState.expiresAt || undefined,
        notes: formState.notes || undefined,
        aiDailyLimit: Number(formState.aiDailyLimit),
        aiWeeklyLimit: Number(formState.aiWeeklyLimit),
        aiActionDailyLimit: Number(formState.aiActionDailyLimit),
        aiActionWeeklyLimit: Number(formState.aiActionWeeklyLimit),
        aiSummaryDailyLimit: Number(formState.aiSummaryDailyLimit),
        aiSummaryWeeklyLimit: Number(formState.aiSummaryWeeklyLimit),
      }),
    onSuccess: (tester) => {
      setGeneratedCode(makeGeneratedCodeFromTester(tester))
      setFormState(initialFormState)
      void queryClient.invalidateQueries({
        queryKey: ['mission-control-testers', proxyBaseUrl],
      })
    },
  })

  const issueAccessMutation = useMutation({
    mutationFn: async (tester: MissionControlTester) => {
      const access = await issueMissionControlAccess(
        proxyBaseUrl,
        tester.id,
        'Generated from SURF CRM',
      )

      return { access, tester }
    },
    onSuccess: ({ access, tester }) => {
      setGeneratedCode(makeGeneratedCodeFromAccess(tester, access))
      void queryClient.invalidateQueries({
        queryKey: ['mission-control-testers', proxyBaseUrl],
      })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({
      testerId,
      status,
    }: {
      testerId: string
      status: MissionControlTesterStatus
    }) => updateMissionControlTesterStatus(proxyBaseUrl, testerId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['mission-control-testers', proxyBaseUrl],
      })
    },
  })

  const updateQuotaMutation = useMutation({
    mutationFn: ({
      testerId,
      limits,
    }: {
      testerId: string
      limits: Required<MissionControlAiQuotaLimits>
    }) =>
      updateMissionControlTesterAiQuota(proxyBaseUrl, testerId, limits),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['mission-control-testers', proxyBaseUrl],
      })
    },
  })

  const testers = testersQuery.data ?? []
  const activeTesters = testers.filter((tester) => tester.status === 'ACTIVE').length
  const activatedTesters = countActivatedTesters(testers)
  const postsScored = countPostsScored(testers)
  const missionAiUnits = countAiUnits(testers, 'missionEnhancement')
  const actionAiUnits = countAiUnits(testers, 'signalAction')
  const summaryAiUnits = countAiUnits(testers, 'reportSynthesis')

  const columns = useMemo<ColumnDef<MissionControlTester>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Testeur',
        cell: ({ row }) => (
          <div className="beta-tester-cell">
            <strong>{row.original.name}</strong>
            <span>{row.original.email}</span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: (info) => (
          <StatusBadge status={info.getValue() as MissionControlTesterStatus} />
        ),
      },
      {
        accessorKey: 'expiresAt',
        header: 'Expiration',
        cell: (info) => formatDate(info.getValue() as string | null),
      },
      {
        id: 'latestAccess',
        header: 'Dernier acces',
        cell: ({ row }) => {
          const latestAccess = getLatestAccess(row.original)

          if (!latestAccess) {
            return '-'
          }

          return (
            <span className="cell-text-long">
              {latestAccess.activatedAt
                ? `Active le ${formatDate(latestAccess.activatedAt)}`
                : `Code cree le ${formatDate(latestAccess.createdAt)}`}
            </span>
          )
        },
      },
      {
        id: 'usage',
        header: 'Usage',
        cell: ({ row }) => {
          const totals = row.original.accesses.reduce(
            (stats, access) => ({
              batches: stats.batches + Number(access.scoreBatches || 0),
              posts: stats.posts + Number(access.postsScored || 0),
            }),
            { batches: 0, posts: 0 },
          )

          return `${totals.posts} posts / ${totals.batches} batchs`
        },
      },
      {
        id: 'aiQuota',
        header: 'Quota IA',
        enableColumnFilter: false,
        cell: ({ row }) => (
          <AiQuotaEditor
            key={[
              row.original.id,
              row.original.aiDailyLimit,
              row.original.aiWeeklyLimit,
              row.original.aiActionDailyLimit,
              row.original.aiActionWeeklyLimit,
              row.original.aiSummaryDailyLimit,
              row.original.aiSummaryWeeklyLimit,
            ].join('-')}
            tester={row.original}
            disabled={updateQuotaMutation.isPending}
            onSave={(limits) =>
              updateQuotaMutation.mutate({
                testerId: row.original.id,
                limits,
              })
            }
          />
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableColumnFilter: false,
        cell: ({ row }) => {
          const tester = row.original
          const isRevoked = tester.status === 'REVOKED'

          return (
            <div className="beta-actions">
              <button
                className="button button--secondary"
                type="button"
                onClick={() => issueAccessMutation.mutate(tester)}
                disabled={
                  isRevoked ||
                  issueAccessMutation.isPending ||
                  updateStatusMutation.isPending
                }
              >
                Nouveau code
              </button>
              <button
                className={isRevoked ? 'button' : 'button button--secondary'}
                type="button"
                onClick={() =>
                  updateStatusMutation.mutate({
                    testerId: tester.id,
                    status: isRevoked ? 'ACTIVE' : 'REVOKED',
                  })
                }
                disabled={issueAccessMutation.isPending || updateStatusMutation.isPending}
              >
                {isRevoked ? 'Reactiver' : 'Revoquer'}
              </button>
            </div>
          )
        },
      },
    ],
    [issueAccessMutation, updateQuotaMutation, updateStatusMutation],
  )

  function updateField(field: keyof FormState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function submitTester(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCopyStatus('')
    createTesterMutation.mutate()
  }

  async function copyActivationCode() {
    if (!generatedCode) return

    try {
      await navigator.clipboard.writeText(generatedCode.activationCode)
      setCopyStatus('Code copie')
    } catch {
      setCopyStatus('Copie impossible, selectionnez le code manuellement')
    }
  }

  const currentError =
    testersQuery.error ??
    createTesterMutation.error ??
    issueAccessMutation.error ??
    updateQuotaMutation.error ??
    updateStatusMutation.error

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Mission Control"
        title="Testeurs beta"
        description="Creez les acces beta prives, copiez les codes d'activation et controlez les droits des testeurs."
      />

      <section className="beta-summary-grid" aria-label="Resume beta">
        <article>
          <span>Total testeurs</span>
          <strong>{testers.length}</strong>
        </article>
        <article>
          <span>Actifs</span>
          <strong>{activeTesters}</strong>
        </article>
        <article>
          <span>Ont active</span>
          <strong>{activatedTesters}</strong>
        </article>
        <article>
          <span>Posts scores</span>
          <strong>{postsScored}</strong>
        </article>
        <article>
          <span>IA mission/S</span>
          <strong>{missionAiUnits}</strong>
        </article>
        <article>
          <span>Actions IA/S</span>
          <strong>{actionAiUnits}</strong>
        </article>
        <article>
          <span>Synthese IA/S</span>
          <strong>{summaryAiUnits}</strong>
        </article>
      </section>

      <section className="beta-control-grid">
        <form className="beta-panel beta-form" onSubmit={submitTester}>
          <div className="panel-heading">
            <div>
              <h2>Generer un code beta</h2>
              <p>Un code est affiche une seule fois apres creation.</p>
            </div>
          </div>

          <label className="form-field">
            Nom du testeur
            <input
              required
              minLength={2}
              maxLength={160}
              value={formState.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="Ex: Xavier Ndriatahina"
              type="text"
            />
          </label>

          <label className="form-field">
            Email
            <input
              required
              value={formState.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="xavier@example.com"
              type="email"
            />
          </label>

          <label className="form-field">
            Expiration optionnelle
            <input
              value={formState.expiresAt}
              onChange={(event) => updateField('expiresAt', event.target.value)}
              type="date"
            />
          </label>

          <div className="beta-quota-create-fields">
            <label className="form-field">
              Mission IA / jour
              <input
                max={20}
                min={0}
                required
                value={formState.aiDailyLimit}
                onChange={(event) => updateField('aiDailyLimit', event.target.value)}
                type="number"
              />
            </label>
            <label className="form-field">
              Mission IA / semaine
              <input
                max={100}
                min={0}
                required
                value={formState.aiWeeklyLimit}
                onChange={(event) => updateField('aiWeeklyLimit', event.target.value)}
                type="number"
              />
            </label>
            <label className="form-field">
              Actions IA / jour
              <input
                max={100}
                min={0}
                required
                value={formState.aiActionDailyLimit}
                onChange={(event) =>
                  updateField('aiActionDailyLimit', event.target.value)
                }
                type="number"
              />
            </label>
            <label className="form-field">
              Actions IA / semaine
              <input
                max={500}
                min={0}
                required
                value={formState.aiActionWeeklyLimit}
                onChange={(event) =>
                  updateField('aiActionWeeklyLimit', event.target.value)
                }
                type="number"
              />
            </label>
            <label className="form-field">
              Synthese IA / jour
              <input
                max={20}
                min={0}
                required
                value={formState.aiSummaryDailyLimit}
                onChange={(event) =>
                  updateField('aiSummaryDailyLimit', event.target.value)
                }
                type="number"
              />
            </label>
            <label className="form-field">
              Synthese IA / semaine
              <input
                max={100}
                min={0}
                required
                value={formState.aiSummaryWeeklyLimit}
                onChange={(event) =>
                  updateField('aiSummaryWeeklyLimit', event.target.value)
                }
                type="number"
              />
            </label>
          </div>

          <label className="form-field">
            Notes
            <textarea
              maxLength={1000}
              value={formState.notes}
              onChange={(event) => updateField('notes', event.target.value)}
              placeholder="Contexte, profil, canal d'invitation..."
              rows={4}
            />
          </label>

          <button
            className="button"
            type="submit"
            disabled={createTesterMutation.isPending}
          >
            {createTesterMutation.isPending ? 'Generation...' : 'Generer le code'}
          </button>
        </form>

        <section className="beta-panel beta-code-panel" aria-label="Code genere">
          <div className="panel-heading">
            <div>
              <h2>Dernier code genere</h2>
              <p>Copiez-le tout de suite avant de changer d'ecran.</p>
            </div>
          </div>

          {generatedCode ? (
            <>
              <div className="beta-code-card">
                <span>{generatedCode.name}</span>
                <strong>{generatedCode.activationCode}</strong>
                <small>{generatedCode.email}</small>
              </div>
              <div className="beta-actions">
                <button
                  className="button"
                  type="button"
                  onClick={() => void copyActivationCode()}
                >
                  Copier le code
                </button>
                <span className="muted-text">{copyStatus}</span>
              </div>
            </>
          ) : (
            <p className="muted-text">
              Aucun code genere dans cette session CRM. Creez un testeur ou
              emettez un nouveau code depuis le tableau.
            </p>
          )}

          {currentError ? (
            <p className="beta-error">{currentError.message}</p>
          ) : null}
        </section>
      </section>

      <DataTable
        columns={columns}
        data={testers}
        emptyTitle="Aucun testeur beta"
        emptyDescription="Creez un premier testeur pour obtenir son code d'activation."
        error={testersQuery.error}
        getRowId={(row) => row.id}
        isLoading={testersQuery.isLoading}
        searchPlaceholder="Rechercher nom, email, statut..."
      />
    </main>
  )
}

function makeGeneratedCodeFromAccess(
  tester: MissionControlTester,
  access: IssuedMissionControlAccess,
): GeneratedCode {
  return {
    testerId: tester.id,
    name: tester.name,
    email: tester.email,
    activationCode: access.activationCode,
    accessId: access.id,
  }
}
