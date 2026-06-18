import { NavLink, Outlet } from 'react-router-dom'

import BarChartIcon from 'lucide-react/dist/esm/icons/bar-chart-3.mjs'
import BellIcon from 'lucide-react/dist/esm/icons/bell-check.mjs'
import ClipboardListIcon from 'lucide-react/dist/esm/icons/clipboard-list.mjs'
import LayoutDashboardIcon from 'lucide-react/dist/esm/icons/layout-dashboard.mjs'
import LightbulbIcon from 'lucide-react/dist/esm/icons/lightbulb.mjs'
import LogOutIcon from 'lucide-react/dist/esm/icons/log-out.mjs'
import ShieldCheckIcon from 'lucide-react/dist/esm/icons/shield-check.mjs'
import TargetIcon from 'lucide-react/dist/esm/icons/target.mjs'
import UsersIcon from 'lucide-react/dist/esm/icons/users-round.mjs'

import { useAuth } from '../../features/auth/authContext'
import { GatewayStatusBanner } from './GatewayStatusBanner'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboardIcon, end: true },
  { to: '/prospects', label: 'Prospects', icon: UsersIcon },
  { to: '/relances', label: 'Relances', icon: BellIcon },
  { to: '/outbound', label: 'Outbound', icon: TargetIcon },
  { to: '/insights', label: 'Insights', icon: LightbulbIcon },
  { to: '/bilans', label: 'Bilans', icon: ClipboardListIcon },
  { to: '/quality', label: 'Qualite CRM', icon: ShieldCheckIcon },
]

export function AppLayout() {
  const { authEnabled, logout, username } = useAuth()

  return (
    <div className="app-frame">
      <aside className="sidebar" aria-label="Navigation principale">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <BarChartIcon size={18} strokeWidth={2.2} />
          </div>
          <div>
            <p className="brand-name">SURF CRM</p>
            <p className="brand-caption">Prospection cockpit</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? 'nav-link nav-link--active' : 'nav-link'
                }
              >
                <Icon size={18} strokeWidth={2.1} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {authEnabled ? (
          <div className="sidebar-session">
            <span className="sidebar-session__user">{username}</span>
            <button
              className="sidebar-session__button"
              title="Se deconnecter"
              type="button"
              onClick={() => void logout()}
            >
              <LogOutIcon size={17} strokeWidth={2.2} aria-hidden="true" />
              <span>Deconnexion</span>
            </button>
          </div>
        ) : null}
      </aside>

      <div className="app-content">
        <GatewayStatusBanner />
        <Outlet />
      </div>
    </div>
  )
}
