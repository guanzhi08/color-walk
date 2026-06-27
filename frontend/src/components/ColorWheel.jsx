import { useState, useRef } from 'react'
import { spinWheel } from '../api/wheel'

const COLORS = [
  { id: 'red',     name: '紅色',   hex: '#DC2626' },
  { id: 'orange',  name: '橙色',   hex: '#EA580C' },
  { id: 'yellow',  name: '黃色',   hex: '#CA8A04' },
  { id: 'green',   name: '綠色',   hex: '#16A34A' },
  { id: 'blue',    name: '藍色',   hex: '#2563EB' },
  { id: 'purple',  name: '紫色',   hex: '#7C3AED' },
  { id: 'pink',    name: '粉紅色', hex: '#DB2777' },
  { id: 'brown',   name: '棕色',   hex: '#92400E' },
  { id: 'neutral', name: '中性色', hex: '#6B7280' },
]

const TOTAL = COLORS.length
const SEGMENT_ANGLE = 360 / TOTAL
const CX = 150, CY = 150, R = 130, R_LABEL = 90

function segmentPath(index) {
  const startDeg = index * SEGMENT_ANGLE - 90
  const endDeg   = startDeg + SEGMENT_ANGLE
  const toRad    = (d) => (d * Math.PI) / 180
  const x1 = CX + R * Math.cos(toRad(startDeg))
  const y1 = CY + R * Math.sin(toRad(startDeg))
  const x2 = CX + R * Math.cos(toRad(endDeg))
  const y2 = CY + R * Math.sin(toRad(endDeg))
  return `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`
}

function labelPos(index) {
  const mid = (index + 0.5) * SEGMENT_ANGLE - 90
  const rad = (mid * Math.PI) / 180
  return { x: CX + R_LABEL * Math.cos(rad), y: CY + R_LABEL * Math.sin(rad) }
}

export default function ColorWheel({ onSpinComplete }) {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning]  = useState(false)
  const [error, setError]        = useState(null)
  const prevRotation = useRef(0)

  const handleSpin = async () => {
    if (spinning) return
    setSpinning(true)
    setError(null)
    try {
      const result = await spinWheel()
      const colorIndex = COLORS.findIndex((c) => c.id === result.color_id)
      const targetDeg = colorIndex * SEGMENT_ANGLE
      // pointer is at top (−90°), align chosen segment center there
      const landAt = 360 - (targetDeg + SEGMENT_ANGLE / 2)
      const newRotation = prevRotation.current + 1800 + ((landAt - prevRotation.current % 360 + 360) % 360)
      prevRotation.current = newRotation
      setRotation(newRotation)
      setTimeout(() => {
        setSpinning(false)
        onSpinComplete(result)
      }, 4200)
    } catch (e) {
      setError(e.response?.data?.detail ?? '轉盤失敗')
      setSpinning(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative select-none">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 text-2xl drop-shadow">▼</div>

        <svg
          width="300" height="300"
          viewBox="0 0 300 300"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4s cubic-bezier(0.17,0.67,0.12,1)' : 'none',
          }}
        >
          {COLORS.map((color, i) => {
            const lp = labelPos(i)
            return (
              <g key={color.id}>
                <path d={segmentPath(i)} fill={color.hex} stroke="white" strokeWidth="2" />
                <text
                  x={lp.x} y={lp.y}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="white" fontSize="11" fontWeight="700"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                >
                  {color.name}
                </text>
              </g>
            )
          })}
          {/* Center circle */}
          <circle cx={CX} cy={CY} r="22" fill="white" stroke="#E5E7EB" strokeWidth="2" />
          <text x={CX} y={CY} textAnchor="middle" dominantBaseline="middle" fontSize="18">🌿</text>
        </svg>
      </div>

      <button onClick={handleSpin} disabled={spinning} className="btn-primary text-lg px-10">
        {spinning ? '轉動中…' : '轉動輪盤'}
      </button>

      {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
    </div>
  )
}
