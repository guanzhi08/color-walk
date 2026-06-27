import { useState, useRef } from 'react'
import { uploadPhoto } from '../api/photos'

const STATUS_LABEL = {
  exact:    { label: '完美符合 ✓', cls: 'badge-exact' },
  close:    { label: '接近色系 ~', cls: 'badge-close' },
  mismatch: { label: '色系不符 ✗', cls: 'badge-mismatch' },
}

export default function PhotoUpload({ spin, onUploaded }) {
  const [preview, setPreview]   = useState(null)
  const [file, setFile]         = useState(null)
  const [result, setResult]     = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError]       = useState(null)
  const inputRef = useRef()

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setError(null)
    setPreview(URL.createObjectURL(f))
  }

  const handleUpload = async () => {
    if (!file || uploading) return
    setUploading(true)
    setError(null)
    try {
      const res = await uploadPhoto(file)
      setResult(res)
      onUploaded(res.photo)
      setFile(null)
      setPreview(null)
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

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg font-extrabold text-pikmin-leaf">今日主色</span>
        {colorDot(spin.color_hex)}
        <span className="font-bold" style={{ color: spin.color_hex }}>{spin.color_name}</span>
      </div>

      {/* Drop zone */}
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
        <button onClick={handleUpload} disabled={uploading} className="btn-primary">
          {uploading ? '上傳中…' : '上傳照片'}
        </button>
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
          {result.photo.lat && (
            <p className="text-xs text-gray-400">
              📍 {result.photo.lat.toFixed(5)}, {result.photo.lng.toFixed(5)}
            </p>
          )}
          <button onClick={() => setResult(null)} className="btn-secondary text-sm mt-1">繼續上傳</button>
        </div>
      )}
    </div>
  )
}
