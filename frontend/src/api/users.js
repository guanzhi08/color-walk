import client from './client'

export const listUsers   = ()           => client.get('/users/').then((r) => r.data)
export const createUser  = (body)       => client.post('/users/', body).then((r) => r.data)
export const deleteUser  = (id)         => client.delete(`/users/${id}`)
export const uploadAvatar = (file)      => {
  const fd = new FormData()
  fd.append('file', file)
  return client.post('/users/me/avatar', fd).then((r) => r.data)
}
