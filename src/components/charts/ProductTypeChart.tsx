'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { formatVND, formatNumber } from '@/lib/utils/format'

interface ProductTypeData {
  name: string
  revenue: number
  quantity: number
  avgPrice: number
}

interface ProductTypeChartProps {
  data: ProductTypeData[]
}

interface TooltipPayloadItem {
  payload: ProductTypeData
}

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: TooltipPayloadItem[]
}) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="text-sm font-medium text-gray-900 mb-2">{data.name}</p>
        <div className="space-y-1 text-xs">
          <p className="text-emerald-600">
            Doanh thu: {formatVND(data.revenue)}
          </p>
          <p className="text-gray-600">
            Số lượng: {formatNumber(data.quantity)}
          </p>
          <p className="text-gray-600">
            Giá TB: {formatVND(data.avgPrice)}
          </p>
        </div>
      </div>
    )
  }
  return null
}

export function ProductTypeChart({ data }: ProductTypeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Chưa có dữ liệu sản phẩm
      </div>
    )
  }

  const chartData = data.map(item => ({
    ...item,
    revenueInMillions: item.revenue / 1000000,
  }))

  return (
    <div className="h-64 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 10, left: -10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
          />
          <YAxis
            yAxisId="left"
            tickFormatter={(value) => `${value}M`}
            tick={{ fontSize: 10 }}
            stroke="#6b7280"
            width={35}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => formatNumber(value)}
            tick={{ fontSize: 10 }}
            stroke="#6b7280"
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          <Bar
            yAxisId="left"
            dataKey="revenueInMillions"
            name="Doanh thu (triệu)"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="right"
            dataKey="quantity"
            name="Số lượng"
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
