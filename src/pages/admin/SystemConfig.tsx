import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FiSettings,
  FiEdit2,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiToggleLeft,
  FiToggleRight,
  FiType,
  FiHash,
  FiAlertCircle,
} from 'react-icons/fi'
import { useAdminConfig } from '@/hooks/useAdmin'

interface ConfigMeta {
  type: 'text' | 'number' | 'boolean'
  icon: React.ElementType
}

const CONFIG_META: Record<string, ConfigMeta> = {
  site_name: { type: 'text', icon: FiType },
  welcome_message: { type: 'text', icon: FiType },
  max_requests_per_day: { type: 'number', icon: FiHash },
  maintenance_mode: { type: 'boolean', icon: FiSettings },
  enable_registration: { type: 'boolean', icon: FiSettings },
}

function ToggleSwitch({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
        enabled
          ? 'bg-teal-600'
          : 'bg-slate-200 dark:bg-slate-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export default function SystemConfig() {
  const { t, i18n } = useTranslation()
  const { data, loading, error, refetch, updateConfigs } = useAdminConfig()
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [saveFeedback, setSaveFeedback] = useState<{
    key: string
    success: boolean
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const configDisplayNames = useMemo<Record<string, string>>(
    () => ({
      site_name: t('systemConfig.displayNames.site_name'),
      welcome_message: t('systemConfig.displayNames.welcome_message'),
      max_requests_per_day: t('systemConfig.displayNames.max_requests_per_day'),
      maintenance_mode: t('systemConfig.displayNames.maintenance_mode'),
      enable_registration: t('systemConfig.displayNames.enable_registration'),
    }),
    [t]
  )

  const configDescriptions = useMemo<Record<string, string>>(
    () => ({
      site_name: t('systemConfig.descriptions.site_name'),
      welcome_message: t('systemConfig.descriptions.welcome_message'),
      max_requests_per_day: t('systemConfig.descriptions.max_requests_per_day'),
      maintenance_mode: t('systemConfig.descriptions.maintenance_mode'),
      enable_registration: t('systemConfig.descriptions.enable_registration'),
    }),
    [t]
  )

  const showFeedback = useCallback(
    (key: string, success: boolean) => {
      setSaveFeedback({ key, success })
      const timer = setTimeout(() => setSaveFeedback(null), 2000)
      return () => clearTimeout(timer)
    },
    []
  )

  const handleSave = async (key: string, value: string) => {
    setSavingKey(key)
    try {
      const ok = await updateConfigs({ [key]: value })
      if (ok) {
        setEditingKey(null)
        showFeedback(key, true)
        refetch()
      } else {
        showFeedback(key, false)
      }
    } catch {
      showFeedback(key, false)
    } finally {
      setSavingKey(null)
    }
  }

  const startEdit = (key: string, value: string) => {
    setEditingKey(key)
    setEditValue(value)
  }

  const cancelEdit = () => {
    setEditingKey(null)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave(key, editValue)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }

  const handleBooleanToggle = async (key: string, currentValue: string) => {
    const newValue = currentValue === 'true' ? 'false' : 'true'
    setSavingKey(key)
    try {
      const ok = await updateConfigs({ [key]: newValue })
      if (ok) {
        showFeedback(key, true)
        refetch()
      } else {
        showFeedback(key, false)
      }
    } catch {
      showFeedback(key, false)
    } finally {
      setSavingKey(null)
    }
  }

  useEffect(() => {
    if (editingKey && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editingKey])

  const formatTime = (dateStr: string) => {
    try {
      const locale = i18n.language.startsWith('zh') ? 'zh-CN' : 'en-US'
      return new Date(dateStr).toLocaleString(locale)
    } catch {
      return dateStr
    }
  }

  const renderValue = (config: { key: string; value: string }) => {
    const meta = CONFIG_META[config.key] || { type: 'text', icon: FiSettings }

    if (meta.type === 'boolean') {
      const enabled = config.value === 'true'
      return (
        <div className="flex items-center gap-3">
          <ToggleSwitch
            enabled={enabled}
            onChange={() => handleBooleanToggle(config.key, config.value)}
            disabled={savingKey === config.key}
          />
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              enabled
                ? 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
            }`}
          >
            {enabled ? (
              <>
                <FiToggleRight className="w-3.5 h-3.5" />
                ON
              </>
            ) : (
              <>
                <FiToggleLeft className="w-3.5 h-3.5" />
                OFF
              </>
            )}
          </span>
        </div>
      )
    }

    if (editingKey === config.key) {
      return (
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type={meta.type === 'number' ? 'number' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, config.key)}
            disabled={savingKey === config.key}
            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none disabled:opacity-60"
          />
          <button
            onClick={() => handleSave(config.key, editValue)}
            disabled={savingKey === config.key}
            className="p-2 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
            title={t('common.save')}
          >
            <FiCheck className="w-4 h-4" />
          </button>
          <button
            onClick={cancelEdit}
            disabled={savingKey === config.key}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            title={t('common.cancel')}
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )
    }

    return (
      <div className="group flex items-center justify-between gap-3">
        <p className="text-sm text-slate-700 dark:text-slate-200 break-all line-clamp-2">
          {config.value}
        </p>
        <button
          onClick={() => startEdit(config.key, config.value)}
          className="shrink-0 p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 opacity-0 group-hover:opacity-100 transition-all"
          title={t('common.save')}
        >
          <FiEdit2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {t('systemConfig.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('systemConfig.subtitle')}
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.97] transition-all disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('systemConfig.refresh')}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/2" />
                </div>
              </div>
              <div className="h-8 bg-slate-100 dark:bg-slate-700 rounded" />
              <div className="mt-3 h-3 bg-slate-100 dark:bg-slate-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : data && data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.map((config) => {
            const meta = CONFIG_META[config.key] || {
              type: 'text',
              icon: FiSettings,
            }
            const Icon = meta.icon
            const isEditing = editingKey === config.key
            const isBoolean = meta.type === 'boolean'
            const feedback = saveFeedback?.key === config.key

            return (
              <div
                key={config.key}
                className={`relative bg-white dark:bg-slate-800 rounded-xl border p-5 transition-all ${
                  feedback
                    ? saveFeedback.success
                      ? 'border-green-300 dark:border-green-700 shadow-sm shadow-green-100 dark:shadow-green-900/20'
                      : 'border-red-300 dark:border-red-700 shadow-sm shadow-red-100 dark:shadow-red-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:shadow-md'
                }`}
              >
                {/* Feedback overlay */}
                {feedback && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium animate-fade-in">
                    {saveFeedback.success ? (
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                        <FiCheck className="w-3 h-3" />
                        {t('systemConfig.saved')}
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                        <FiAlertCircle className="w-3 h-3" />
                        {t('systemConfig.saveFailed')}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isBoolean && config.value === 'true'
                        ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400'
                        : 'bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {configDisplayNames[config.key] || config.key}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                      {config.key}
                    </p>
                  </div>
                  {!isBoolean && !isEditing && (
                    <button
                      onClick={() => startEdit(config.key, config.value)}
                      className="shrink-0 p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors"
                      title={t('common.save')}
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 leading-relaxed">
                  {configDescriptions[config.key] || ''}
                </p>

                {/* Value / Editor */}
                <div className="min-h-[2.5rem]">{renderValue(config)}</div>

                {/* Footer */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {t('systemConfig.updatedAt')}: {formatTime(config.updated_at)}
                  </span>
                  {savingKey === config.key && (
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <span className="w-3 h-3 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      {t('common.loading')}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
            <FiSettings className="w-7 h-7 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            {t('systemConfig.noConfig')}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {t('systemConfig.noConfigDesc')}
          </p>
        </div>
      )}
    </div>
  )
}
