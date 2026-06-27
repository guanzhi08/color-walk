import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getPhotos, deletePhoto } from '../api/photos'
import { listUsers, uploadAvatar } from '../api/users'
import { useAuth } from '../context/AuthContext'

// Fix Vite + Leaflet default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow })

const MATCH_LABEL = { exact: '完美', close: '接近', mismatch: '不符' }

function Avatar({ user, selected, isMe, onSelect, onUploadClick }) {
  return (
    <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer" onClick={onSelect}>
      <div className={`relative rounded-full transition-all duration-200 ${
        selected ? 'ring-4 ring-pikmin-green ring-offset-2 scale-110' : 'ring-2 ring-transparent hover:ring-pikmin-softgreen'
      }`}>
        {user.avatar_url
          ? <img src={user.avatar_url} className="w-14 h-14 rounded-full object-cover" />
          : <div className="w-14 h-14 rounded-full bg-pikmin-softgreen flex items-center justify-center text-pikmin-leaf font-extrabold text-xl">
              {user.username[0].toUpperCase()}
            </div>
        }
        {isMe && (
          <button
            onClick={(e) => { e.stopPropagation(); onUploadClick() }}
            className="absolute -bottom-0.5 -right-0.5 bg-pikmin-green hover:bg-pikmin-leaf text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow transition-colors"
            title="更換頭像"
          >✎</button>
        )}
      </div>
      <span className={`text-xs font-bold transition-colors ${selected ? 'text-pikmin-leaf' : 'text-gray-400'}`}>
        {user.username}
      </span>
    </div>
  )
}

function Lightbox({ photo, onClose, onDelete, me }) {
  const [deleting, setDeleting] = useState(false)
  const canDelete = me?.id === photo.user_id || me?.is_admin

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deletePhoto(photo.id)
      onDelete(photo.id)
      onClose()
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 animate-overlay-in"
      onClick={onClose}
    >
      <div
        className="relative max-w-xl w-full animate-photo-zoom"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={photo.cloudinary_url}
          className="w-full max-h-[55vh] object-contain rounded-2xl shadow-2xl"
        />

        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white text-gray-600 hover:text-gray-900 rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg transition-colors text-lg leading-none"
        >×</button>

        {/* Map */}
        {photo.lat != null && photo.lng != null && (
          <div className="mt-3 rounded-xl overflow-hidden" style={{ height: 160 }}>
            <MapContainer
              center={[photo.lat, photo.lng]}
              zoom={15}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[photo.lat, photo.lng]} />
            </MapContainer>
          </div>
        )}

        {/* Info bar */}
        <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-white text-sm">
          {photo.color_spin && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full inline-block border border-white/40"
                    style={{ background: photo.color_spin.color_hex }} />
              <span className="font-semibold">{photo.color_spin.color_name}</span>
              {photo.color_match_status && (
                <span className={`badge-${photo.color_match_status}`}>
                  {MATCH_LABEL[photo.color_match_status]}
                </span>
              )}
            </div>
          )}
          {photo.lat != null && (
            <span className="text-white/70 text-xs">
              📍 {photo.lat.toFixed(4)}, {photo.lng.toFixed(4)}
            </span>
          )}
          {photo.taken_at && (
            <span className="text-white/70 text-xs ml-auto">
              {new Date(photo.taken_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {/* Delete */}
        {canDelete && (
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs font-bold text-red-300 hover:text-red-100 disabled:opacity-50 transition-colors px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
            >
              {deleting ? '刪除中…' : '刪除照片'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user: me, setUser } = useAuth()
  const [users, setUsers]             = useState([])
  const [selectedId, setSelectedId]   = useState(null)
  const [photos, setPhotos]           = useState([])
  const [filterDate, setFilterDate]   = useState(todayStr())
  const [loading, setLoading]         = useState(false)
  const [lightbox, setLightbox]       = useState(null)
  const [tileKey, setTileKey]         = useState(0)
  const avatarInputRef                = useRef()

  function todayStr() { return new Date().toISOString().slice(0, 10) }

  useEffect(() => {
    listUsers().then((list) => {
      setUsers(list)
      const mine = list.find((u) => u.id === me?.id)
      setSelectedId((mine ?? list[0])?.id ?? null)
    }).catch(() => {})
  }, [me?.id])

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    setTileKey((k) => k + 1)
    getPhotos({ user_id: selectedId, upload_date: filterDate })
      .then(setPhotos)
      .finally(() => setLoading(false))
  }, [selectedId, filterDate])

  const handleAvatarFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    e.target.value = ''
    const updated = await uploadAvatar(f)
    setUser(updated)
    setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u))
  }

  const handlePhotoDeleted = (photoId) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId))
  }

  const selectedUser = users.find((u) => u.id === selectedId)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">

      {/* Avatar row */}
      <div className="card">
        <div className="flex gap-5 overflow-x-auto py-3 px-1">
          {users.map((u) => (
            <Avatar
              key={u.id}
              user={u}
              selected={selectedId === u.id}
              isMe={u.id === me?.id}
              onSelect={() => setSelectedId(u.id)}
              onUploadClick={() => avatarInputRef.current?.click()}
            />
          ))}
        </div>
        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
      </div>

      {/* Date + title */}
      <div className="flex flex-wrap items-center gap-3">
        {selectedUser && (
          <span className="text-lg font-extrabold text-pikmin-leaf">{selectedUser.username} 的照片</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs font-bold text-gray-400">日期</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="input w-40 text-sm"
          />
        </div>
      </div>

      {/* Photo wall */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-9 h-9 border-4 border-pikmin-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : photos.length === 0 ? (
        <p className="text-center text-gray-400 py-16 font-semibold text-sm">這天還沒有照片 🌿</p>
      ) : (
        <div key={tileKey} className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="aspect-square overflow-hidden rounded-xl cursor-pointer group relative animate-tile-in"
              style={{ animationDelay: `${i * 35}ms` }}
              onClick={() => setLightbox(photo)}
            >
              <img
                src={photo.cloudinary_url}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              {photo.color_spin && (
                <div
                  className="absolute top-1.5 left-1.5 w-3 h-3 rounded-full border border-white/60 shadow"
                  style={{ background: photo.color_spin.color_hex }}
                />
              )}
              {photo.color_match_status && (
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-start p-1.5">
                  <span className={`badge-${photo.color_match_status} text-[10px]`}>
                    {MATCH_LABEL[photo.color_match_status]}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          photo={lightbox}
          onClose={() => setLightbox(null)}
          onDelete={handlePhotoDeleted}
          me={me}
        />
      )}
    </div>
  )
}
