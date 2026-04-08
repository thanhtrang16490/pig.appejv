'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatVND, formatDate } from '@/lib/utils/format'

interface DailyRevenueData {
  transaction_date: string
  total_revenue: number
  total_transactions: number
  total_quantity: number
}

interface DailyRevenueTrendChartProps {
  data: DailyRevenueData[]
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-900">
          {formatDate(label || '')}
        </p>
        <p className="text-sm text-emerald-600 font-semibold">
          Doanh thu: {formatVND(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

export function DailyRevenueTrendChart({ data }: DailyRevenueTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Chưa có dữ liệu doanh thu
      </div>
    )
  }

  // Sort by date ascending for the chart
  const sortedData = [...data].sort((a, b) => 
    new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
  )

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={sortedData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="transaction_date"
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getDate()}/${date.getMonth() + 1}`
            }}
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
          />
          <YAxis
            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="total_revenue"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
