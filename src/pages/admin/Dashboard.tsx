import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FiUsers,
  FiUserPlus,
  FiActivity,
  FiBarChart2,
} from 'react-icons/fi'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useAdminStats } from '@/hooks/useAdmin'

const COLORS = ['#0D9488', '#14B8A6', '#0F766E', '#5EEAD4', '#99F6E4']

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
}: {
  title: string
  value: string | number
  icon: React.ElementType
  trend?: string
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {trend && <p className="text-xs text-slate-400 mt-1">{trend}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { data, loading, error } = useAdminStats()

  const chartData = useMemo(() => {
    if (!data?.dailyUserStats) return []
    return data.dailyUserStats.map((item) => ({
      date: item.date.slice(5),
      users: item.count,
    }))
  }, [data])

  const pieData = useMemo(() => {
    if (!data?.usageStats) return []
    return data.usageStats.map((item) => ({
      name: item.action,
      value: item.count,
    }))
  }, [data])

  const actionNameMap: Record<string, string> = {
    analyze: '报告分析',
    chat: '智能对话',
    plan: '计划生成',
    quiz: '健康问答',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-red-600 dark:text-red-400">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('admin.dashboard')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('admin.title')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('admin.users')}
          value={data?.totalUsers ?? 0}
          icon={FiUsers}
          trend={`+${data?.todayNewUsers ?? 0} today`}
          color="#0D9488"
        />
        <StatCard
          title="Today"
          value={data?.todayNewUsers ?? 0}
          icon={FiUserPlus}
          trend="Active growth"
          color="#3B82F6"
        />
        <StatCard
          title="Total Calls"
          value={data?.totalLogs ?? 0}
          icon={FiActivity}
          trend={`${data?.todayLogs ?? 0} today`}
          color="#F59E0B"
        />
        <StatCard
          title="Activity"
          value={data?.totalLogs && data.totalUsers ? Math.round(data.totalLogs / data.totalUsers) : 0}
          icon={FiBarChart2}
          trend="Per user"
          color="#10B981"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User trend chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm transition-colors">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">{t('admin.dashboard')}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} stroke="#CBD5E1" />
                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} stroke="#CBD5E1" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#0D9488"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                  name="Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Usage distribution pie chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm transition-colors">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Usage</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown, name: unknown) => [
                    value as number,
                    actionNameMap[name as string] || (name as string),
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {actionNameMap[entry.name] || entry.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
