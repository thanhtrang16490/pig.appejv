'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatVND } from '@/lib/utils/format'

interface FarmRevenuePieChartProps {
  data: { name: string; value: number }[]
}

// Expanded color palette for desktop pie chart (12 distinct colors)
const COLORS = [
  '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5',
  '#047857', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'
]

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

// Format large numbers for display
function formatCompactVND(value: number): string {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1) + 'T'
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + 'M'
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(1) + 'K'
  }
  return value.toString()
}

// Mobile list view component
function MobileRevenueList({ data }: { data: { name: string; value: number }[] }) {
  // Sort by revenue descending
  const sortedData = [...data].sort((a, b) => b.value - a.value)
  const maxValue = sortedData[0]?.value || 1

  return (
    <div className="space-y-3">
      {sortedData.map((item, index) => {
        const percentage = (item.value / maxValue) * 100
        return (
          <div key={item.name} className="flex items-center gap-3">
            {/* Rank number */}
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full">
              {index + 1}
            </span>
            
            {/* Farm name and bar */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate mb-1">
                {item.name}
              </p>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            
            {/* Amount */}
            <span className="flex-shrink-0 text-sm font-semibold text-emerald-600 text-right">
              {formatCompactVND(item.value)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function FarmRevenuePieChart({ data }: FarmRevenuePieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Chưa có dữ liệu doanh thu
      </div>
    )
  }

  // Prepare data with percentages for desktop
  const totalValue = data.reduce((sum, item) => sum + item.value, 0)
  const chartData = data.map(item => ({
    ...item,
    percent: totalValue > 0 ? (item.value / totalValue) * 100 : 0
  }))

  return (
    <>
      {/* Mobile: Vertical ranked list */}
      <div className="md:hidden">
        <MobileRevenueList data={data} />
      </div>

      {/* Desktop: Pie chart */}
      <div className="hidden md:block h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={40}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              layout="vertical" 
              align="right" 
              verticalAlign="middle"
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}
