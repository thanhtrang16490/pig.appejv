'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatVND } from '@/lib/utils/format'

interface FarmRevenueData {
  farm_name: string
  total_revenue: number
}

interface FarmRevenueChartProps {
  data: FarmRevenueData[]
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm text-emerald-600 font-semibold">
          {formatVND(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

export function FarmRevenueChart({ data }: FarmRevenueChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Chưa có dữ liệu doanh thu
      </div>
    )
  }

  // Sort by revenue descending
  const sortedData = [...data].sort((a, b) => b.total_revenue - a.total_revenue)

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <XAxis
            type="number"
            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
            className="text-xs text-gray-500"
          />
          <YAxis
            type="category"
            dataKey="farm_name"
            width={100}
            tick={{ fontSize: 12 }}
            className="text-xs text-gray-600"
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="total_revenue" radius={[0, 4, 4, 0]}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#10b981" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
