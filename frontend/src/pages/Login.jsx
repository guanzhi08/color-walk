import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)
  const { loginSuccess }        = useAuth()
  const navigate                = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data = await login(username, password)
      loginSuccess(data)
      navigate('/')
    } catch (e) {
      setError(e.response?.data?.detail ?? '登入失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pikmin-sky to-pikmin-cream px-4">
      <div className="card w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🌿</div>
          <h1 className="text-2xl font-extrabold text-pikmin-leaf">Color Walk</h1>
          <p className="text-sm text-gray-400 mt-1">用顏色記錄每一步</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-bold text-gray-500 mb-1 block">帳號</label>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="輸入帳號"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-500 mb-1 block">密碼</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="輸入密碼"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center font-semibold">{error}</p>}

          <button type="submit" className="btn-primary mt-2" disabled={loading}>
            {loading ? '登入中…' : '登入'}
          </button>
        </form>
      </div>
    </div>
  )
}
