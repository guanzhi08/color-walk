import client from './client'

export const uploadPhoto = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return client.post('/photos/upload', fd).then((r) => r.data)
}

export const getPhotos = (params) => client.get('/photos/', { params }).then((r) => r.data)

export const deletePhoto = (id) => client.delete(`/photos/${id}`)
