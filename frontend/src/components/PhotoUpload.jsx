import { useState, useRef } from 'react'
import client from '../api/client'

const STATUS_LABEL = {
  exact:    { label: '完美符合 ✓', cls: 'badge-exact' },
  close:    { label: '接近色系 ~', cls: 'badge-close' },
  mismatch: { label: '色系不符 ✗', cls: 'badge-mismatch' },
}

function getBrowserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()    => resolve(null),
      { timeout: 8000, maximumAge: 60000 }
    )
  })
}

export default function PhotoUpload({ spin, onUploaded }) {
  const [preview, setPreview]     = useState(null)
  const [file, setFile]           = useState(null)
  const [result, setResult]       = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState(null)
  const [locState, setLocState]   = useState(null) // null | 'locating' | {lat,lng} | 'denied'
  const inputRef = useRef()

  const handleFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setError(null)
    setPreview(URL.createObjectURL(f))
    setLocState('locating')
    const loc = await getBrowserLocation()
    setLocState(loc ?? 'denied')
  }

  const handleUpload = async () => {
    if (!file || uploading) return
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (locState && locState !== 'denied' && locState !== 'locating') {
        fd.append('manual_lat', locState.lat)
        fd.append('manual_lng', locState.lng)
      }
      const res = await client.post('/photos/upload', fd).then(r => r.data)
      setResult(res)
      onUploaded(res.photo)
      setFile(null)
      setPreview(null)
      setLocState(null)
    } catch (e) {
      setError(e.response?.data?.detail ?? '上傳失敗')
    } finally {
      setUploading(false)
    }
  }

  const colorDot = (hex) => (
    <span className="inline-block w-4 h-4 rounded-full border border-white shadow-sm align-middle"
          style={{ background: hex }} />
  )

  const locBadge = () => {
    if (!locState || locState === 'locating')
      return <span className="text-xs text-gray-400 flex items-center gap-1"><span className="animate-spin">⏳</span> 定位中…</span>
    if (locState === 'denied')
      return <span className="text-xs text-gray-400">📍 無位置資訊</span>
    return <span className="text-xs text-pikmin-leaf">📍 {locState.lat.toFixed(5)}, {locState.lng.toFixed(5)}</span>
  }

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg font-extrabold text-pikmin-leaf">今日主色</span>
        {colorDot(spin.color_hex)}
        <span className="font-bold" style={{ color: spin.color_hex }}>{spin.color_name}</span>
      </div>

      <div
        onClick={() => inputRef.current.click()}
        className="border-2 border-dashed border-pikmin-softgreen rounded-xl2 p-6 text-center cursor-pointer
                   hover:bg-pikmin-mist transition-colors"
      >
        {preview
          ? <img src={preview} className="max-h-56 mx-auto rounded-xl object-contain" />
          : <div className="text-gray-400 flex flex-col items-center gap-2">
              <span className="text-4xl">📷</span>
              <span className="text-sm font-semibold">點擊選擇照片</span>
            </div>
        }
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {file && !result && (
        <div className="flex flex-col gap-2">
          {locState !== null && (
            <div className="bg-pikmin-mist rounded-xl px-3 py-2">{locBadge()}</div>
          )}
          <button
            onClick={handleUpload}
            disabled={uploading || locState === 'locating'}
            className="btn-primary"
          >
            {uploading ? '上傳中…' : locState === 'locating' ? '等待定位…' : '上傳照片'}
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm font-semibold text-center">{error}</p>}

      {result && (
        <div className="bg-pikmin-mist rounded-xl2 p-4 flex flex-col gap-2">
          <p className="font-bold text-pikmin-leaf">上傳成功！</p>
          <div className="flex items-center gap-2 text-sm">
            <span>偵測到：</span>
            <span className="font-semibold">{result.color_match.detected_color_name}</span>
            <span className={STATUS_LABEL[result.color_match.status]?.cls}>
              {STATUS_LABEL[result.color_match.status]?.label}
            </span>
          </div>
          {result.photo.lat
            ? <p className="text-xs text-gray-400">📍 {result.photo.lat.toFixed(5)}, {result.photo.lng.toFixed(5)}</p>
            : <p className="text-xs text-gray-400">📍 無位置資訊</p>
          }
          <button onClick={() => setResult(null)} className="btn-secondary text-sm mt-1">繼續上傳</button>
        </div>
      )}
    </div>
  )
}
