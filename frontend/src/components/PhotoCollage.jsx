import { deletePhoto } from '../api/photos'
import { useAuth } from '../context/AuthContext'

const MATCH_BADGE = {
  exact:    <span className="badge-exact">完美</span>,
  close:    <span className="badge-close">接近</span>,
  mismatch: <span className="badge-mismatch">不符</span>,
}

export default function PhotoCollage({ photos, onDeleted }) {
  const { user } = useAuth()

  if (!photos.length) return (
    <p className="text-center text-gray-400 py-10 font-semibold">這天還沒有照片</p>
  )

  const handleDelete = async (photo) => {
    if (!confirm('確定要刪除這張照片嗎？')) return
    await deletePhoto(photo.id)
    onDeleted(photo.id)
  }

  return (
    <div className="columns-2 sm:columns-3 md:columns-4 gap-3 space-y-3">
      {photos.map((p) => (
        <div key={p.id} className="break-inside-avoid group relative rounded-xl2 overflow-hidden shadow-card bg-white">
          <img src={p.cloudinary_url} className="w-full object-cover" loading="lazy" />

          <div className="p-2 flex items-center justify-between gap-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-gray-600">{p.user?.username}</span>
              {p.color_match_status && MATCH_BADGE[p.color_match_status]}
            </div>
            {(user?.id === p.user_id || user?.is_admin) && (
              <button
                onClick={() => handleDelete(p)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600 text-lg leading-none"
                title="刪除"
              >×</button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
