COLOR_PALETTE = [
    {"id": "red",     "name": "紅色",   "hex": "#DC2626"},
    {"id": "orange",  "name": "橙色",   "hex": "#EA580C"},
    {"id": "yellow",  "name": "黃色",   "hex": "#CA8A04"},
    {"id": "green",   "name": "綠色",   "hex": "#16A34A"},
    {"id": "blue",    "name": "藍色",   "hex": "#2563EB"},
    {"id": "purple",  "name": "紫色",   "hex": "#7C3AED"},
    {"id": "pink",    "name": "粉紅色", "hex": "#DB2777"},
    {"id": "brown",   "name": "棕色",   "hex": "#92400E"},
    {"id": "neutral", "name": "灰色",   "hex": "#6B7280"},
]

COLOR_ADJACENCY: dict[str, list[str]] = {
    "red":     ["orange", "pink"],
    "orange":  ["red", "yellow", "brown"],
    "yellow":  ["orange", "green"],
    "green":   ["yellow", "blue"],
    "blue":    ["green", "purple"],
    "purple":  ["blue", "pink"],
    "pink":    ["purple", "red"],
    "brown":   ["orange", "neutral"],
    "neutral": ["brown"],
}
