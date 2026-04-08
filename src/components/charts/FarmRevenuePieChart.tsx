'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatVND } from '@/lib/utils/format'

interface FarmRevenuePieChartProps {
  data: { name: string; value: number }[]
}

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5']

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { percent?: number } }>
}) {
  if (active && payload && payload.length) {
    const data = payload[0]
    const percent = data.payload?.percent
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-900">{data.name}</p>
        <p className="text-sm text-emerald-600 font-semibold">
          {formatVND(data.value)}
        </p>
        {percent !== undefined && (
          <p className="text-xs text-gray-500">
            {percent.toFixed(1)}%
          </p>
        )}
      </div>
    )
  }
  return null
}

export function FarmRevenuePieChart({ data }: FarmRevenuePieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Chưa có dữ liệu doanh thu
      </div>
    )
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
