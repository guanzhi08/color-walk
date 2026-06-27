import { useState, useEffect } from 'react'
import { listUsers, createUser, deleteUser } from '../api/users'
import { uploadAvatar } from '../api/users'
import { useAuth } from '../context/AuthContext'

export default function Admin() {
  const { user: me, setUser } = useAuth()
  const [users, setUsers]     = useState([])
  const [form, setForm]       = useState({ username: '', password: '', is_admin: false })
  const [creating, setCreating] = useState(false)
  const [error, setError]     = useState(null)

  const load = () => listUsers().then(setUsers)
  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      await createUser(form)
      setForm({ username: '', password: '', is_admin: false })
      load()
    } catch (e) {
      setError(e.response?.data?.detail ?? '新增失敗')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (u) => {
    if (!confirm(`確定刪除 ${u.username}？`)) return
    await deleteUser(u.id)
    load()
  }

  const handleAvatarChange = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const updated = await uploadAvatar(f)
    setUser(updated)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
      <h2 className="text-2xl font-extrabold text-pikmin-leaf">管理員</h2>

      {/* My avatar */}
      <div className="card flex items-center gap-5">
        <label className="cursor-pointer group relative">
          {me?.avatar_url
            ? <img src={me.avatar_url} className="w-16 h-16 rounded-full object-cover border-4 border-pikmin-softgreen" />
            : <div className="w-16 h-16 rounded-full bg-pikmin-softgreen flex items-center justify-center text-pikmin-leaf font-extrabold text-2xl border-4 border-pikmin-green">
                {me?.username?.[0]?.toUpperCase()}
              </div>
          }
          <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center
                          opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">
            更換
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </label>
        <div>
          <p className="font-extrabold text-pikmin-leaf text-lg">{me?.username}</p>
          <p className="text-xs text-gray-400">點擊頭像更換大頭貼</p>
        </div>
      </div>

      {/* Create user */}
      <div className="card">
        <h3 className="font-extrabold text-pikmin-leaf mb-4">新增使用者</h3>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <input
            className="input"
            placeholder="帳號"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <input
            type="password"
            className="input"
            placeholder="密碼"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_admin}
              onChange={(e) => setForm({ ...form, is_admin: e.target.checked })}
              className="w-4 h-4 accent-pikmin-green"
            />
            管理員權限
          </label>
          {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
          <button type="submit" disabled={creating} className="btn-primary">
            {creating ? '新增中…' : '新增使用者'}
          </button>
        </form>
      </div>

      {/* User list */}
      <div className="card">
        <h3 className="font-extrabold text-pikmin-leaf mb-4">使用者列表</h3>
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded-xl2 bg-pikmin-mist">
              <div className="flex items-center gap-3">
                {u.avatar_url
                  ? <img src={u.avatar_url} className="w-9 h-9 rounded-full object-cover" />
                  : <div className="w-9 h-9 rounded-full bg-pikmin-softgreen flex items-center justify-center text-pikmin-leaf font-bold">
                      {u.username[0].toUpperCase()}
                    </div>
                }
                <div>
                  <p className="font-bold text-gray-700">{u.username}</p>
                  {u.is_admin && <span className="text-xs text-pikmin-leaf font-bold">管理員</span>}
                </div>
              </div>
              {u.id !== me?.id && (
                <button onClick={() => handleDelete(u)} className="text-red-400 hover:text-red-600 text-sm font-bold transition-colors">
                  刪除
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
