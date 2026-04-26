import { useState, useRef, useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import SettingsModal from './SettingsModal'
import ApiSettings from './ApiSettings'
import { hasStoredApiConfig } from '@/lib/aiConfig'
import { getAvatarDisplayUrl } from '@/lib/avatar'
import {
  FiHome,
  FiFileText,
  FiClipboard,
  FiMessageSquare,
  FiHelpCircle,
  FiSettings,
  FiMenu,
  FiX,
  FiActivity,
  FiLogOut,
  FiCpu,
  FiMoon,
  FiSun,
  FiGlobe,
} from 'react-icons/fi'
import { useTheme } from '@/hooks/useTheme'
import { useTranslation } from 'react-i18next'

const navItems = [
  { path: '/home', label: '首页', icon: FiHome },
  { path: '/report', label: '报告分析', icon: FiFileText },
  { path: '/plan', label: '计划生成', icon: FiClipboard },
  { path: '/chat', label: '智能对话', icon: FiMessageSquare },
  { path: '/quiz', label: '健康问答', icon: FiHelpCircle },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { resolvedTheme, toggleTheme } = useTheme()
  const { t, i18n } = useTranslation()
  const toggleLanguage = () => {
    const next = i18n.language.startsWith('zh') ? 'en' : 'zh-CN'
    i18n.changeLanguage(next)
  }
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [apiSettingsOpen, setApiSettingsOpen] = useState(false)
  const [apiConfigured, setApiConfigured] = useState(hasStoredApiConfig())
  const userMenuRef = useRef<HTMLDivElement>(null)

  // 监听 storage 事件，同步多标签页的 AI 配置状态变化
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'health_ai_config') {
        setApiConfigured(hasStoredApiConfig())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  const handleLogout = async () => {
    await logout()
    // 使用 window.location.href 进行完整页面刷新，确保清除所有状态并跳转到根路径
    window.location.href = '/'
  }

  const avatarDisplay = useMemo(() => {
    const avatar = user?.avatar || localStorage.getItem('user_avatar') || undefined
    return getAvatarDisplayUrl(avatar)
  }, [user?.avatar])

  return (
    <div className="min-h-screen bg-background-secondary flex flex-col">
      {/* Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <FiActivity className="w-5 h-5 text-white" />
              </div>
              <Link to="/home" className="text-xl font-semibold text-foreground dark:text-foreground-dark tracking-tight">
                Health Project
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-foreground-muted hover:text-foreground hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                title={resolvedTheme === 'dark' ? t('theme.light') : t('theme.dark')}
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg text-foreground-muted hover:text-foreground hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                {resolvedTheme === 'dark' ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
              </button>

              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                title={i18n.language.startsWith('zh') ? 'English' : '中文'}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <FiGlobe className="w-4 h-4" />
                <span>{i18n.language.startsWith('zh') ? 'EN' : '中'}</span>
              </button>

              {/* AI Config Button */}
              <button
                onClick={() => setApiSettingsOpen(true)}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  apiConfigured
                    ? 'text-green-600 bg-green-50 hover:bg-green-100'
                    : 'text-red-600 bg-red-50 hover:bg-red-100'
                }`}
                title={t('nav.aiConfig')}
              >
                <FiCpu className="w-4 h-4" />
                <span>{t('nav.aiConfig')}</span>
                <span
                  className={`w-2 h-2 rounded-full ${apiConfigured ? 'bg-green-500' : 'bg-red-500'}`}
                />
              </button>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-gray-100 transition-all"
                >
                  <img
                    src={avatarDisplay}
                    alt="avatar"
                    className="w-8 h-8 rounded-full bg-gray-100"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = '/User/default.svg';
                    }}
                  />
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {user?.username}
                  </span>
                </button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-fade-in">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-foreground">{user?.username}</p>
                        <p className="text-xs text-foreground-subtle truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false)
                          setSettingsOpen(true)
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground-muted hover:bg-gray-50 transition-colors"
                      >
                        <FiSettings className="w-4 h-4" />
                        账号设置
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FiLogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-foreground-muted hover:bg-gray-100"
              >
                {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 animate-fade-in">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-foreground-muted hover:text-foreground hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                )
              })}
              <div className="border-t border-gray-100 my-2" />
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
              >
                <FiLogOut className="w-5 h-5" />
                退出登录
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16 bg-background-secondary dark:bg-background-dark-secondary transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 py-6 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-foreground-subtle dark:text-foreground-dark-subtle">
          <p>Health Project - 智能健康诊断平台 | 本工具仅供参考，不能替代专业医疗建议</p>
        </div>
      </footer>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <ApiSettings
        isOpen={apiSettingsOpen}
        onClose={() => {
          setApiSettingsOpen(false)
          setApiConfigured(hasStoredApiConfig())
        }}
        onConfigChange={() => setApiConfigured(hasStoredApiConfig())}
      />
    </div>
  )
}
