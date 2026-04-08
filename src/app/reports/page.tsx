import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatVND, formatNumber, formatWeight } from "@/lib/utils/format";
import { FarmSummary, DailySummary, CustomerSummary, Transaction } from "@/lib/types/database";
import { 
  TrendingUp, 
  Receipt, 
  PiggyBank, 
  Scale, 
  Wallet,
  Calendar
} from "lucide-react";
import { FarmRevenuePieChart } from "@/components/charts/FarmRevenuePieChart";
import { DailyRevenueTrendChart } from "@/components/charts/DailyRevenueTrendChart";
import { ProductTypeChart } from "@/components/charts/ProductTypeChart";

export const metadata: Metadata = {
  title: "Báo cáo - Quản Lý Bán Heo",
  description: "Báo cáo tổng quan doanh thu và phân tích",
};

async function getFarmSummary(): Promise<FarmSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farm_summary")
    .select("*")
    .order("total_revenue", { ascending: false });

  if (error) {
    console.error("Error fetching farm summary:", error);
    return [];
  }

  return (data as FarmSummary[]) || [];
}

async function getDailySummary(): Promise<DailySummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_summary")
    .select("*")
    .order("transaction_date", { ascending: true });

  if (error) {
    console.error("Error fetching daily summary:", error);
    return [];
  }

  return (data as DailySummary[]) || [];
}

async function getCustomerDebtReport(): Promise<CustomerSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_summary")
    .select("*")
    .gt("outstanding_debt", 0)
    .order("outstanding_debt", { ascending: false });

  if (error) {
    console.error("Error fetching customer debt report:", error);
    return [];
  }

  return (data as CustomerSummary[]) || [];
}

async function getProductBreakdown() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("product_type, total_invoice, quantity, unit_price");

  if (error) {
    console.error("Error fetching product breakdown:", error);
    return { heoThit: { revenue: 0, quantity: 0, avgPrice: 0 }, heoCon: { revenue: 0, quantity: 0, avgPrice: 0 } };
  }

  const transactions = data as Transaction[];
  
  const heoThit = transactions.filter(t => t.product_type === 'heo_thit');
  const heoCon = transactions.filter(t => t.product_type === 'heo_con');

  const heoThitRevenue = heoThit.reduce((sum, t) => sum + (t.total_invoice || 0), 0);
  const heoThitQuantity = heoThit.reduce((sum, t) => sum + (t.quantity || 0), 0);
  const heoThitAvgPrice = heoThitQuantity > 0 ? heoThitRevenue / heoThitQuantity : 0;

  const heoConRevenue = heoCon.reduce((sum, t) => sum + (t.total_invoice || 0), 0);
  const heoConQuantity = heoCon.reduce((sum, t) => sum + (t.quantity || 0), 0);
  const heoConAvgPrice = heoConQuantity > 0 ? heoConRevenue / heoConQuantity : 0;

  return {
    heoThit: { revenue: heoThitRevenue, quantity: heoThitQuantity, avgPrice: heoThitAvgPrice },
    heoCon: { revenue: heoConRevenue, quantity: heoConQuantity, avgPrice: heoConAvgPrice },
  };
}

function getDebtStatusColor(percentPaid: number): string {
  if (percentPaid >= 80) return "text-green-600 bg-green-50";
  if (percentPaid >= 50) return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
}

export default async function ReportsPage() {
  const [farmSummary, dailySummary, debtReport, productBreakdown] = await Promise.all([
    getFarmSummary(),
    getDailySummary(),
    getCustomerDebtReport(),
    getProductBreakdown(),
  ]);

  // Calculate monthly overview
  const totalRevenue = farmSummary.reduce((sum, f) => sum + f.total_revenue, 0);
  const totalTransactions = farmSummary.reduce((sum, f) => sum + f.transaction_count, 0);
  const totalAnimals = farmSummary.reduce((sum, f) => sum + f.total_quantity, 0);
  const totalWeight = farmSummary.reduce((sum, f) => sum + f.total_weight_kg, 0);
  const totalDebt = debtReport.reduce((sum, c) => sum + c.outstanding_debt, 0);

  // Prepare chart data
  const farmRevenueData = farmSummary.map(f => ({
    name: f.farm_name,
    value: f.total_revenue,
  }));

  const productTypeData = [
    {
      name: "Heo thịt",
      revenue: productBreakdown.heoThit.revenue,
      quantity: productBreakdown.heoThit.quantity,
      avgPrice: productBreakdown.heoThit.avgPrice,
    },
    {
      name: "Heo con",
      revenue: productBreakdown.heoCon.revenue,
      quantity: productBreakdown.heoCon.quantity,
      avgPrice: productBreakdown.heoCon.avgPrice,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Báo cáo" />

      {/* Section 1: Monthly Overview */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tổng quan</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            title="Tổng doanh thu"
            value={formatVND(totalRevenue)}
            icon={<TrendingUp className="w-5 h-5" />}
            color="success"
          />
          <StatCard
            title="Tổng giao dịch"
            value={formatNumber(totalTransactions)}
            icon={<Receipt className="w-5 h-5" />}
            color="default"
          />
          <StatCard
            title="Tổng số lượng"
            value={formatNumber(totalAnimals)}
            icon={<PiggyBank className="w-5 h-5" />}
            color="default"
          />
          <StatCard
            title="Tổng trọng lượng"
            value={formatWeight(totalWeight)}
            icon={<Scale className="w-5 h-5" />}
            color="default"
          />
          <StatCard
            title="Tổng công nợ"
            value={formatVND(totalDebt)}
            icon={<Wallet className="w-5 h-5" />}
            color="danger"
          />
        </div>
      </section>

      {/* Section 2: Revenue by Farm */}
      <section>
        <Card title="Doanh thu theo trại">
          <FarmRevenuePieChart data={farmRevenueData} />
        </Card>
      </section>

      {/* Section 3: Daily Revenue Trend */}
      <section>
        <Card title="Doanh thu theo ngày">
          <DailyRevenueTrendChart data={dailySummary} />
        </Card>
      </section>

      {/* Section 4: Product Analysis */}
      <section>
        <Card title="Phân tích sản phẩm">
          <ProductTypeChart data={productTypeData} />
        </Card>
      </section>

      {/* Section 5: Debt Aging Report */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Báo cáo công nợ</h2>
        {debtReport.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">
              Không có công nợ nào
            </div>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-sm border border-gray-100">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Khách hàng</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Tổng doanh thu</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Đã thanh toán</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Còn nợ</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Tỷ lệ thanh toán</th>
                </tr>
              </thead>
              <tbody>
                {debtReport.map((customer) => {
                  const percentPaid = customer.total_revenue > 0 
                    ? (customer.total_paid / customer.total_revenue) * 100 
                    : 0;
                  const statusClass = getDebtStatusColor(percentPaid);
                  
                  return (
                    <tr key={customer.customer_id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 px-4 text-sm text-gray-900">{customer.customer_name}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right">
                        {formatVND(customer.total_revenue)}
                      </td>
                      <td className="py-3 px-4 text-sm text-emerald-600 text-right">
                        {formatVND(customer.total_paid)}
                      </td>
                      <td className="py-3 px-4 text-sm text-red-600 font-medium text-right">
                        {formatVND(customer.outstanding_debt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                          {percentPaid.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
