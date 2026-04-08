import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FarmRevenueChart } from '@/components/charts/FarmRevenueChart'
import { formatVND, formatDate, formatNumber } from '@/lib/utils/format'
import { TrendingUp, AlertCircle, ShoppingCart, Package, Plus, CreditCard } from 'lucide-react'
import type { Transaction, CustomerSummary, FarmSummary } from '@/lib/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get current month/year for subtitle
  const now = new Date()
  const monthYear = now.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })

  // Fetch summary stats
  const { data: transactions } = await supabase
    .from('transactions')
    .select('total_invoice, outstanding_debt, quantity')

  // Fetch farm summary for chart
  const { data: farmSummary } = await supabase
    .from('farm_summary')
    .select('*')

  // Fetch top 10 customers by debt
  const { data: customerDebt } = await supabase
    .from('customer_summary')
    .select('*')
    .gt('outstanding_debt', 0)
    .order('outstanding_debt', { ascending: false })
    .limit(10)

  // Fetch recent transactions
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('*, farm:farms(*), customer:customers(*)')
    .order('transaction_date', { ascending: false })
    .limit(10)

  // Calculate summary stats
  const totalRevenue = transactions?.reduce((sum, t) => sum + (t.total_invoice || 0), 0) || 0
  const totalDebt = transactions?.reduce((sum, t) => sum + (t.outstanding_debt || 0), 0) || 0
  const transactionCount = transactions?.length || 0
  const totalQuantity = transactions?.reduce((sum, t) => sum + (t.quantity || 0), 0) || 0

  // Product type labels
  const productTypeLabels: Record<string, string> = {
    heo_thit: 'Heo thịt',
    heo_con: 'Heo con',
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <PageHeader
          title="Tổng quan"
          subtitle={monthYear}
        />

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Tổng doanh thu"
            value={formatVND(totalRevenue)}
            icon={<TrendingUp className="w-5 h-5" />}
            color="success"
          />
          <StatCard
            title="Tổng công nợ"
            value={formatVND(totalDebt)}
            icon={<AlertCircle className="w-5 h-5" />}
            color="danger"
          />
          <StatCard
            title="Số giao dịch"
            value={formatNumber(transactionCount)}
            icon={<ShoppingCart className="w-5 h-5" />}
            color="info"
          />
          <StatCard
            title="Tổng số lượng"
            value={formatNumber(totalQuantity)}
            icon={<Package className="w-5 h-5" />}
            color="warning"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <Link
            href="/sales/new"
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tạo đơn mới
          </Link>
          <Link
            href="/debts"
            className="flex-1 flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            Ghi nhận thanh toán
          </Link>
        </div>

        {/* Revenue by Farm Chart */}
        <Card title="Doanh thu theo trại" className="mb-6">
          <FarmRevenueChart data={(farmSummary as FarmSummary[]) || []} />
        </Card>

        {/* Top 10 Customers by Debt */}
        <Card title="Top 10 khách hàng nợ nhiều nhất" className="mb-6">
          {customerDebt && customerDebt.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {(customerDebt as CustomerSummary[]).map((customer) => (
                <Link
                  key={customer.customer_id}
                  href={`/customers/${customer.customer_id}`}
                  className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-4 px-4 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {customer.customer_name}
                    </p>
                    {customer.customer_address && (
                      <p className="text-xs text-gray-500 truncate">
                        {customer.customer_address}
                      </p>
                    )}
                  </div>
                  <Badge variant="danger">
                    {formatVND(customer.outstanding_debt)}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Không có công nợ"
              description="Hiện tại không có khách hàng nào đang nợ."
            />
          )}
        </Card>

        {/* Recent Transactions */}
        <Card title="Giao dịch gần đây">
          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {(recentTransactions as Transaction[]).map((transaction) => (
                <Link
                  key={transaction.id}
                  href={`/sales/${transaction.id}`}
                  className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-4 px-4 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.customer?.name || 'Khách hàng'}
                      </p>
                      <Badge variant="default">
                        {productTypeLabels[transaction.product_type] || transaction.product_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(transaction.transaction_date)} · {transaction.farm?.name || 'Trại'}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatVND(transaction.total_invoice)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Chưa có giao dịch"
              description="Bắt đầu bằng cách tạo đơn hàng mới."
              action={
                <Link
                  href="/sales/new"
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Tạo đơn mới
                </Link>
              }
            />
          )}
        </Card>
      </div>
    </div>
  )
}
