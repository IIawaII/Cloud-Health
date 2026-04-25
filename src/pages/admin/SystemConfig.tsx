import { useState } from 'react'
import {
  FiSettings,
  FiEdit2,
  FiCheck,
  FiX,
  FiRefreshCw,
} from 'react-icons/fi'
import { useAdminConfig } from '@/hooks/useAdmin'

export default function SystemConfig() {
  const { data, loading, error, refetch, updateConfigs } = useAdminConfig()
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async (key: string) => {
    setSaving(true)
    const ok = await updateConfigs({ [key]: editValue })
    setSaving(false)
    if (ok) {
      setEditingKey(null)
      refetch()
    }
  }

  const configDisplayNames: Record<string, string> = {
    site_name: '站点名称',
    welcome_message: '欢迎消息',
    max_requests_per_day: '每日最大请求数',
    maintenance_mode: '维护模式',
    enable_registration: '允许注册',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">系统配置</h1>
          <p className="text-sm text-slate-500 mt-1">管理平台运行参数和全局开关</p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data && data.length > 0 ? (
            data.map((config) => (
              <div
                key={config.key}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                      <FiSettings className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        {configDisplayNames[config.key] || config.key}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">{config.key}</p>
                    </div>
                  </div>
                  {editingKey === config.key ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSave(config.key)}
                        disabled={saving}
                        className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                      >
                        <FiCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingKey(null)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingKey(config.key)
                        setEditValue(config.value)
                      }}
                      className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {editingKey === config.key ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    autoFocus
                  />
                ) : (
                  <p className="text-sm text-slate-600 break-all">{config.value}</p>
                )}

                <p className="text-xs text-slate-400 mt-2">
                  更新时间: {new Date(config.updated_at).toLocaleString('zh-CN')}
                </p>
              </div>
            ))
          ) : (
            <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                <FiSettings className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">暂无系统配置</p>
              <p className="text-xs text-slate-400 mt-1">
                配置项会在首次设置后显示在这里
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
