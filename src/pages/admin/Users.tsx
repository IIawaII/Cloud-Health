import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiShield,
  FiCheck,
  FiX,
} from 'react-icons/fi'
import { useAdminUsers } from '@/hooks/useAdmin'
import { getAvatarDisplayUrl } from '@/lib/avatar'

const roleBadge = (role: string, t: (k: string) => string) => {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
        <FiShield className="w-3 h-3" />
        {t('admin.role.admin')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
      <FiUser className="w-3 h-3" />
      {t('admin.role.user')}
    </span>
  )
}

export default function Users() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRole, setEditRole] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const pageSize = 10

  const { data, loading, error, refetch, updateUserRole, deleteUser } = useAdminUsers(page, pageSize, search)

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleUpdateRole = async (id: string) => {
    setActionError(null)
    const ok = await updateUserRole(id, editRole)
    if (ok) {
      setEditingId(null)
      refetch()
    } else {
      setActionError('更新用户角色失败，请稍后重试')
    }
  }

  const handleDelete = async (id: string) => {
    setActionError(null)
    const ok = await deleteUser(id)
    if (ok) {
      setDeletingId(null)
      refetch()
    } else {
      setActionError('删除用户失败，请稍后重试')
    }
  }

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">用户管理</h1>
        <p className="text-sm text-slate-500 mt-1">管理平台注册用户，查看、编辑和删除用户</p>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索用户名或邮箱"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
        >
          搜索
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm flex items-center justify-between">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-red-400 hover:text-red-600 transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">用户</th>
                <th className="px-4 py-3">邮箱</th>
                <th className="px-4 py-3">角色</th>
                <th className="px-4 py-3">注册时间</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : data?.users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                    暂无用户数据
                  </td>
                </tr>
              ) : (
                data?.users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatar ? (
                          <img
                            src={getAvatarDisplayUrl(user.avatar)}
                            alt={user.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                            {user.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-slate-800">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      {editingId === user.id ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                          <option value="user">普通用户</option>
                          <option value="admin">管理员</option>
                        </select>
                      ) : (
                        roleBadge(user.role, t)
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(user.created_at).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === user.id ? (
                          <>
                            <button
                              onClick={() => handleUpdateRole(user.id)}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                              title="确认"
                            >
                              <FiCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                              title="取消"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(user.id)
                                setEditRole(user.role)
                              }}
                              className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors"
                              title="编辑角色"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            {deletingId === user.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(user.id)}
                                  className="px-2 py-1 rounded-lg text-xs text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  确认
                                </button>
                                <button
                                  onClick={() => setDeletingId(null)}
                                  className="px-2 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-100 transition-colors"
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletingId(user.id)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                title="删除"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              共 {data?.total} 条记录，第 {page} / {totalPages} 页
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
