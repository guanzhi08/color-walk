import client from './client'

export const login = (username, password) => {
  const form = new URLSearchParams({ username, password })
  return client.post('/auth/login', form).then((r) => r.data)
}

export const getMe = () => client.get('/auth/me').then((r) => r.data)
