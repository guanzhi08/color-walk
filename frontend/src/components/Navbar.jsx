import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-soft sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-xl text-pikmin-leaf">
          <span className="text-2xl">🌿</span>
          <span>Color Walk</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm font-semibold text-gray-500 hover:text-pikmin-leaf transition-colors">今日</Link>
          <Link to="/dashboard" className="text-sm font-semibold text-gray-500 hover:text-pikmin-leaf transition-colors">看板</Link>
          {user?.is_admin && (
            <Link to="/admin" className="text-sm font-semibold text-gray-500 hover:text-pikmin-leaf transition-colors">管理</Link>
          )}

          <div className="flex items-center gap-2 ml-2">
            {user?.avatar_url
              ? <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover border-2 border-pikmin-softgreen" />
              : <div className="w-8 h-8 rounded-full bg-pikmin-softgreen flex items-center justify-center text-pikmin-leaf font-bold text-sm">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
            }
            <span className="text-sm font-semibold hidden sm:block">{user?.username}</span>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-400 transition-colors ml-1">登出</button>
          </div>
        </div>
      </div>
    </nav>
  )
}
