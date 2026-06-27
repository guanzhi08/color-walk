import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

// Fix default leaflet icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function colorIcon(hex) {
  return L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${hex};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

export default function MapView({ photos }) {
  const withGps = photos.filter((p) => p.lat != null && p.lng != null)

  if (!withGps.length) return (
    <div className="rounded-xl2 bg-pikmin-mist flex items-center justify-center h-48 text-gray-400 text-sm font-semibold">
      沒有含有地理資訊的照片
    </div>
  )

  const center = [
    withGps.reduce((s, p) => s + p.lat, 0) / withGps.length,
    withGps.reduce((s, p) => s + p.lng, 0) / withGps.length,
  ]

  return (
    <MapContainer center={center} zoom={14} className="rounded-xl2 z-0" style={{ height: '320px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      />
      {withGps.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={colorIcon(p.color_spin?.color_hex ?? '#7DC87B')}
        >
          <Popup>
            <img src={p.cloudinary_url} className="w-32 h-24 object-cover rounded" />
            <p className="text-xs mt-1 text-center font-semibold">{p.user?.username}</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
