export type ProductType = 'heo_thit' | 'heo_con'
export type PaymentMethod = 'cash' | 'bank' | 'company'

export interface Farm {
  id: string
  name: string
  group_name: string | null
  location: string | null
  created_at: string
}

export interface Customer {
  id: string
  name: string
  address: string | null
  phone: string | null
  notes: string | null
  created_at: string
}

export interface Transaction {
  id: string
  transaction_date: string
  farm_id: string
  customer_id: string
  product_type: ProductType
  quantity: number
  total_weight_kg: number
  avg_weight_kg: number
  unit_price: number
  revenue_by_count: number
  excess_weight_kg: number
  excess_price_per_kg: number
  excess_revenue: number
  total_invoice: number
  payment_cash: number
  payment_bank: number
  payment_company: number
  total_paid: number
  outstanding_debt: number
  surplus: number
  notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  farm?: Farm
  customer?: Customer
}

export interface Payment {
  id: string
  transaction_id: string
  customer_id: string
  payment_date: string
  amount: number
  method: PaymentMethod
  notes: string | null
  created_at: string
}

export interface CustomerSummary {
  customer_id: string
  customer_name: string
  customer_address: string | null
  total_revenue: number
  total_paid: number
  outstanding_debt: number
  transaction_count: number
}

export interface FarmSummary {
  farm_id: string
  farm_name: string
  group_name: string | null
  location: string | null
  total_revenue: number
  total_quantity: number
  total_weight_kg: number
  transaction_count: number
}

export interface DailySummary {
  transaction_date: string
  total_revenue: number
  total_transactions: number
  total_quantity: number
}
