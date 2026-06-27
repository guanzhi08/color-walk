import { useState, useEffect } from 'react'
import { getTodaySpin } from '../api/wheel'
import ColorWheel from '../components/ColorWheel'
import PhotoUpload from '../components/PhotoUpload'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()
  const [spin, setSpin]       = useState(undefined)  // undefined=loading, null=no spin, obj=spun
  const [photos, setPhotos]   = useState([])

  useEffect(() => {
    getTodaySpin().then(setSpin).catch(() => setSpin(null))
  }, [])

  const handleSpinComplete = (result) => setSpin(result)
  const handleUploaded     = (photo)  => setPhotos((prev) => [photo, ...prev])

  const today = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="text-center">
        <p className="text-sm font-bold text-pikmin-green uppercase tracking-widest">{today}</p>
        <h2 className="text-2xl font-extrabold text-pikmin-leaf mt-1">
          {user?.username} 的今日散步
        </h2>
      </div>

      {/* Wheel area */}
      {spin === undefined && (
        <div className="flex justify-center py-10">
          <div className="w-10 h-10 border-4 border-pikmin-green border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {spin === null && (
        <div className="card text-center">
          <p className="text-gray-500 mb-5 font-semibold">今天還沒轉輪盤，快來決定今日主色！</p>
          <ColorWheel onSpinComplete={handleSpinComplete} />
        </div>
      )}

      {spin && (
        <div className="card text-center">
          <p className="text-sm text-gray-400 font-semibold mb-2">今日主色</p>
          <div className="flex items-center justify-center gap-3 mb-2">
            <span
              className="inline-block w-10 h-10 rounded-full border-4 border-white shadow-card"
              style={{ background: spin.color_hex }}
            />
            <span className="text-3xl font-extrabold" style={{ color: spin.color_hex }}>
              {spin.color_name}
            </span>
          </div>
          <p className="text-xs text-gray-400">
            轉盤時間：{new Date(spin.spun_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}

      {/* Upload area */}
      {spin && <PhotoUpload spin={spin} onUploaded={handleUploaded} />}

      {/* Today's uploaded photos */}
      {photos.length > 0 && (
        <div>
          <h3 className="font-extrabold text-pikmin-leaf mb-3">今天上傳的照片</h3>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <img
                key={p.id}
                src={p.cloudinary_url}
                className="rounded-xl2 w-full aspect-square object-cover shadow-soft"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
