import { useState, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getAvatarDisplayUrl } from '@/lib/avatar'
import {
  FiHome,
  FiUsers,
  FiDatabase,
  FiSettings,
  FiMenu,
  FiLogOut,
  FiActivity,
  FiShield,
  FiClipboard,
  FiChevronsLeft,
  FiChevronsRight,
} from 'react-icons/fi'

const navItems = [
  { path: '/admin', label: '仪表盘', icon: FiHome },
  { path: '/admin/users', label: '用户管理', icon: FiUsers },
  { path: '/admin/data', label: '数据管理', icon: FiDatabase },
  { path: '/admin/config', label: '系统配置', icon: FiSettings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const avatarDisplay = useMemo(() => {
    const avatar = user?.avatar || localStorage.getItem('user_avatar') || undefined
    return getAvatarDisplayUrl(avatar)
  }, [user?.avatar])

  const handleLogout = async () => {
    await logout()
    window.location.href = '/'
  }

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-slate-900 text-white flex flex-col transition-all duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Brand */}
        <div
          className={`h-16 flex items-center gap-3 border-b border-slate-800 ${
            collapsed ? 'justify-center px-2' : 'px-6'
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0">
            <FiShield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && <span className="text-lg font-semibold tracking-tight">后台管理</span>}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-4 space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                } ${collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && item.label}
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:block px-3 pb-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? '展开侧边栏' : '收起侧边栏'}
            className={`flex items-center rounded-lg text-xs text-slate-500 hover:text-white hover:bg-slate-800 transition-colors ${
              collapsed ? 'justify-center w-full px-2 py-2' : 'gap-2 px-3 py-2 w-full'
            }`}
          >
            {collapsed ? <FiChevronsRight className="w-4 h-4" /> : <FiChevronsLeft className="w-4 h-4" />}
            {!collapsed && '收起'}
          </button>
        </div>

        {/* Bottom info */}
        <div className={`p-4 border-t border-slate-800 ${collapsed ? 'flex flex-col items-center' : ''}`}>
          <div className={`flex items-center gap-3 mb-3 ${collapsed ? 'justify-center' : ''}`}>
            <img
              src={avatarDisplay}
              alt="avatar"
              className="w-8 h-8 rounded-full bg-gray-100 object-cover"
            />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            title={collapsed ? '退出登录' : undefined}
            className={`flex items-center rounded-lg text-sm text-red-400 hover:bg-slate-800 transition-colors ${
              collapsed ? 'justify-center w-full px-2 py-2' : 'gap-2 px-3 py-2 w-full'
            }`}
          >
            <FiLogOut className="w-4 h-4" />
            {!collapsed && '退出登录'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <FiMenu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <FiActivity className="w-4 h-4 text-teal-500" />
              <span>Health Project</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-800 font-medium">后台管理</span>
            </div>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <FiClipboard className="w-4 h-4" />
            <span className="hidden sm:inline">返回前台</span>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
