import { createBrowserRouter } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import type { ComponentType, ReactNode } from 'react'

import { AppLayout } from '../shared/layout/AppLayout'

function routeElement(element: ReactNode) {
  return (
    <Suspense fallback={<section className="table-state">Chargement...</section>}>
      {element}
    </Suspense>
  )
}

function lazyElement(loader: () => Promise<{ default: ComponentType }>) {
  const LazyPage = lazy(loader)

  return routeElement(<LazyPage />)
}

export function createAppRouter() {
  return createBrowserRouter([
    {
      path: '/',
      element: <AppLayout />,
      children: [
        {
          index: true,
          element: lazyElement(() =>
            import('../features/dashboard/DashboardPage').then((module) => ({
              default: module.DashboardPage,
            })),
          ),
        },
        {
          path: 'prospects',
          element: lazyElement(() =>
            import('../features/prospects/ProspectsPage').then((module) => ({
              default: module.ProspectsPage,
            })),
          ),
        },
        {
          path: 'prospects/:prospectId',
          element: lazyElement(() =>
            import('../features/prospects/ProspectDetailPage').then((module) => ({
              default: module.ProspectDetailPage,
            })),
          ),
        },
        {
          path: 'relances',
          element: lazyElement(() =>
            import('../features/relances/RelancesPage').then((module) => ({
              default: module.RelancesPage,
            })),
          ),
        },
        {
          path: 'outbound',
          element: lazyElement(() =>
            import('../features/outbound/OutboundPage').then((module) => ({
              default: module.OutboundPage,
            })),
          ),
        },
        {
          path: 'insights',
          element: lazyElement(() =>
            import('../features/insights/InsightsPage').then((module) => ({
              default: module.InsightsPage,
            })),
          ),
        },
        {
          path: 'bilans',
          element: lazyElement(() =>
            import('../features/weeklyReviews/WeeklyReviewsPage').then((module) => ({
              default: module.WeeklyReviewsPage,
            })),
          ),
        },
        {
          path: 'quality',
          element: lazyElement(() =>
            import('../features/quality/QualityPage').then((module) => ({
              default: module.QualityPage,
            })),
          ),
        },
      ],
    },
  ])
}
