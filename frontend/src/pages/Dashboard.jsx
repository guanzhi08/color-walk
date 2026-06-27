import { useState, useEffect } from 'react'
import { getPhotos } from '../api/photos'
import { listUsers } from '../api/users'
import { useAuth } from '../context/AuthContext'
import PhotoCollage from '../components/PhotoCollage'
import MapView from '../components/MapView'

export default function Dashboard() {
  const { user } = useAuth()
  const [users, setUsers]       = useState([])
  const [photos, setPhotos]     = useState([])
  const [filterUser, setFilterUser] = useState('')
  const [filterDate, setFilterDate] = useState(today())
  const [loading, setLoading]   = useState(false)

  function today() {
    return new Date().toISOString().slice(0, 10)
  }

  useEffect(() => {
    if (user?.is_admin) listUsers().then(setUsers).catch(() => {})
  }, [user])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (filterUser) params.user_id = filterUser
    if (filterDate) params.upload_date = filterDate
    getPhotos(params)
      .then(setPhotos)
      .finally(() => setLoading(false))
  }, [filterUser, filterDate])

  const handleDeleted = (id) => setPhotos((prev) => prev.filter((p) => p.id !== id))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
      <h2 className="text-2xl font-extrabold text-pikmin-leaf">Dashboard</h2>

      {/* Filters */}
      <div className="card flex flex-wrap gap-4 items-center">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500">日期</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="input w-44"
          />
        </div>

        {user?.is_admin && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500">使用者</label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="input w-40"
            >
              <option value="">全部</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
          </div>
        )}

        <div className="ml-auto text-sm text-gray-400 font-semibold self-end pb-1">
          共 {photos.length} 張
        </div>
      </div>

      {/* Map */}
      <div className="card p-0 overflow-hidden">
        <MapView photos={photos} />
      </div>

      {/* Collage */}
      <div className="card">
        {loading
          ? <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-pikmin-green border-t-transparent rounded-full animate-spin" />
            </div>
          : <PhotoCollage photos={photos} onDeleted={handleDeleted} />
        }
      </div>
    </div>
  )
}
