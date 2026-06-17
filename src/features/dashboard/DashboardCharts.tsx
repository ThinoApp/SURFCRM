import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { DashboardMetrics } from '../../data/transforms/deriveDashboardMetrics'

const chartColors = ['#0B63F6', '#24A148', '#F59E0B', '#D64545', '#18B7C8']

export function DashboardCharts({ metrics }: { metrics: DashboardMetrics }) {
  return (
    <section className="chart-grid" aria-label="Graphiques CRM">
      <article className="dashboard-panel chart-panel">
        <div className="panel-heading">
          <div>
            <h2>Prospects par statut</h2>
            <p>Lecture rapide du pipeline actif.</p>
          </div>
        </div>
        <ResponsiveContainer height={240} width="100%">
          <PieChart>
            <Pie
              data={metrics.prospectsByStatus}
              dataKey="count"
              innerRadius={52}
              nameKey="status"
              outerRadius={86}
              paddingAngle={3}
            >
              {metrics.prospectsByStatus.map((item, index) => (
                <Cell
                  fill={chartColors[index % chartColors.length]}
                  key={item.status}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </article>

      <article className="dashboard-panel chart-panel">
        <div className="panel-heading">
          <div>
            <h2>Relances</h2>
            <p>Etat des actions planifiees.</p>
          </div>
        </div>
        <ResponsiveContainer height={240} width="100%">
          <BarChart data={metrics.relancesByState}>
            <XAxis dataKey="status" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#F59E0B" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </article>

      <article className="dashboard-panel chart-panel">
        <div className="panel-heading">
          <div>
            <h2>Signaux conversation</h2>
            <p>Reponses actives vs attentes silencieuses.</p>
          </div>
        </div>
        <ResponsiveContainer height={240} width="100%">
          <BarChart data={metrics.conversationSignalData}>
            <XAxis dataKey="status" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#24A148" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </article>
    </section>
  )
}
