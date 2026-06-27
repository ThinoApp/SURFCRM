import type { ColumnDef } from '@tanstack/react-table'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import { getCrmRuntimeConfig } from '../../app/crmConfig'
import {
  createMissionControlTester,
  issueMissionControlAccess,
  listMissionControlTesters,
  updateMissionControlTesterStatus,
} from '../../data/missionControl/missionControlAdminClient'
import type {
  CreatedMissionControlTester,
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
}

const initialFormState: FormState = {
  name: '',
  email: '',
  expiresAt: '',
  notes: '',
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

  const testers = testersQuery.data ?? []
  const activeTesters = testers.filter((tester) => tester.status === 'ACTIVE').length
  const activatedTesters = countActivatedTesters(testers)
  const postsScored = countPostsScored(testers)

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
    [issueAccessMutation, updateStatusMutation],
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
