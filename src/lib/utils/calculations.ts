export interface SaleCalculation {
  quantity: number
  totalWeightKg: number
  unitPrice: number
  excessPricePerKg: number
  paymentCash: number
  paymentBank: number
  paymentCompany: number
}

export function calculateSale(input: SaleCalculation) {
  const avgWeightKg = input.quantity > 0 ? input.totalWeightKg / input.quantity : 0
  const revenueByCount = input.quantity * input.unitPrice
  const excessWeightKg = avgWeightKg > 6 ? (avgWeightKg - 6) * input.quantity : 0
  const excessRevenue = excessWeightKg * input.excessPricePerKg
  const totalInvoice = revenueByCount + excessRevenue
  const totalPaid = input.paymentCash + input.paymentBank + input.paymentCompany
  const outstandingDebt = Math.max(0, totalInvoice - totalPaid)
  const surplus = Math.max(0, totalPaid - totalInvoice)

  return {
    avgWeightKg: Math.round(avgWeightKg * 100) / 100,
    revenueByCount,
    excessWeightKg: Math.round(excessWeightKg * 100) / 100,
    excessRevenue,
    totalInvoice,
    totalPaid,
    outstandingDebt,
    surplus,
  }
}
