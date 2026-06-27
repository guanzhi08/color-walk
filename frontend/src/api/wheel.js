import client from './client'

export const getTodaySpin = () => client.get('/wheel/today').then((r) => r.data)
export const spinWheel    = () => client.post('/wheel/spin').then((r) => r.data)
