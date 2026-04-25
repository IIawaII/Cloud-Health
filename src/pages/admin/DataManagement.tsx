import { useState } from 'react'
import {
  FiChevronLeft,
  FiChevronRight,
  FiActivity,
  FiMessageSquare,
  FiClipboard,
  FiHelpCircle,
  FiFileText,
  FiShield,
} from 'react-icons/fi'
import { useAdminLogs, useAdminAuditLogs } from '@/hooks/useAdmin'

const actionConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  analyze: { label: '报告分析', color: 'bg-blue-50 text-blue-600', icon: FiFileText },
  chat: { label: '智能对话', color: 'bg-teal-50 text-teal-600', icon: FiMessageSquare },
  plan: { label: '计划生成', color: 'bg-amber-50 text-amber-600', icon: FiClipboard },
  quiz: { label: '健康问答', color: 'bg-purple-50 text-purple-600', icon: FiHelpCircle },
}

function ActionBadge({ action }: { action: string }) {
  const config = actionConfig[action] || { label: action, color: 'bg-slate-50 text-slate-600', icon: FiActivity }
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  )
}

export default function DataManagement() {
  const [activeTab, setActiveTab] = useState<'usage' | 'audit'>('usage')
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const pageSize = 15

  const {
    data: usageData,
    loading: usageLoading,
    error: usageError,
  } = useAdminLogs(page, pageSize, actionFilter || undefined)

  const {
    data: auditData,
    loading: auditLoading,
    error: auditError,
  } = useAdminAuditLogs(page, pageSize)

  const totalPages = activeTab === 'usage'
    ? (usageData ? Math.ceil(usageData.total / pageSize) : 0)
    : (auditData ? Math.ceil(auditData.total / pageSize) : 0)

  const loading = activeTab === 'usage' ? usageLoading : auditLoading
  const error = activeTab === 'usage' ? usageError : auditError

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">数据管理</h1>
        <p className="text-sm text-slate-500 mt-1">查看平台使用日志和管理员审计记录</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-1 shadow-sm w-fit">
        <button
          onClick={() => { setActiveTab('usage'); setPage(1) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'usage'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          使用日志
        </button>
        <button
          onClick={() => { setActiveTab('audit'); setPage(1) }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'audit'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          审计日志
        </button>
      </div>

      {/* Filters for usage logs */}
      {activeTab === 'usage' && (
        <div className="flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
          >
            <option value="">全部操作</option>
            <option value="analyze">报告分析</option>
            <option value="chat">智能对话</option>
            <option value="plan">计划生成</option>
            <option value="quiz">健康问答</option>
          </select>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                {activeTab === 'usage' ? (
                  <>
                    <th className="px-4 py-3">操作类型</th>
                    <th className="px-4 py-3">用户ID</th>
                    <th className="px-4 py-3">元数据</th>
                    <th className="px-4 py-3">时间</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3">操作</th>
                    <th className="px-4 py-3">管理员</th>
                    <th className="px-4 py-3">目标</th>
                    <th className="px-4 py-3">详情</th>
                    <th className="px-4 py-3">时间</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'usage' ? 4 : 5} className="px-4 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : activeTab === 'usage' ? (
                usageData?.logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                      暂无使用日志
                    </td>
                  </tr>
                ) : (
                  usageData?.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3"><ActionBadge action={log.action} /></td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">{log.user_id ?? '匿名'}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                        {log.metadata ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(log.created_at).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))
                )
              ) : (
                auditData?.logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                      暂无审计日志
                    </td>
                  </tr>
                ) : (
                  auditData?.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600">
                          <FiShield className="w-3 h-3" />
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">{log.admin_id}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {log.target_type ? `${log.target_type}:${log.target_id}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{log.details ?? '-'}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(log.created_at).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              共 {activeTab === 'usage' ? usageData?.total : auditData?.total} 条记录，第 {page} / {totalPages} 页
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
