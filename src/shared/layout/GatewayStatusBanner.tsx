import { getCrmRuntimeConfig } from '../../app/crmConfig'
import { useCrmSnapshot } from '../../data/queries/useCrmSnapshot'

export function GatewayStatusBanner() {
  const config = getCrmRuntimeConfig()
  const snapshotQuery = useCrmSnapshot()

  if (config.dataSource !== 'google-sheets' || !snapshotQuery.isError) {
    return null
  }

  return (
    <section className="gateway-banner" role="alert">
      <div>
        <strong>Connexion Google Sheets echouee</strong>
        <span>{snapshotQuery.error.message}</span>
      </div>
      <button
        className="button button--secondary"
        disabled={snapshotQuery.isFetching}
        type="button"
        onClick={() => void snapshotQuery.refetch()}
      >
        Reessayer
      </button>
    </section>
  )
}
