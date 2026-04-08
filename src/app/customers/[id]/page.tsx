import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatVND, formatDate } from "@/lib/utils/format";
import { Customer, Transaction, Payment, ProductType } from "@/lib/types/database";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Phone,
  FileText,
  PiggyBank,
  Wallet,
  CreditCard,
  Receipt,
  Calendar,
  Edit,
} from "lucide-react";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getCustomer(id: string): Promise<Customer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

async function getCustomerTransactions(id: string): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, farm:farms(name)")
    .eq("customer_id", id)
    .order("transaction_date", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
  return data || [];
}

async function getCustomerPayments(id: string): Promise<Payment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("customer_id", id)
    .order("payment_date", { ascending: false });

  if (error) {
    console.error("Error fetching payments:", error);
    return [];
  }
  return data || [];
}

function getProductTypeLabel(type: ProductType): string {
  return type === "heo_thit" ? "Heo thịt" : "Heo con";
}

function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: "Tiền mặt",
    bank: "Chuyển khoản",
    company: "Chuyển công ty",
  };
  return labels[method] || method;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;
  const [customer, transactions, payments] = await Promise.all([
    getCustomer(id),
    getCustomerTransactions(id),
    getCustomerPayments(id),
  ]);

  if (!customer) {
    notFound();
  }

  // Calculate summary stats
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total_invoice, 0);
  const totalPaid = transactions.reduce((sum, t) => sum + t.total_paid, 0);
  const outstandingDebt = transactions.reduce((sum, t) => sum + t.outstanding_debt, 0);
  const transactionCount = transactions.length;

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Link
        href="/customers"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách
      </Link>

      {/* Customer Info Card */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
            {customer.address && (
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {customer.address}
              </p>
            )}
            {customer.phone && (
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                {customer.phone}
              </p>
            )}
            {customer.notes && (
              <p className="text-sm text-gray-500 mt-2 flex items-start gap-1.5">
                <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{customer.notes}</span>
              </p>
            )}
          </div>
          <Link
            href={`/customers/${id}/edit`}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit className="w-5 h-5" />
          </Link>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Tổng doanh thu"
          value={formatVND(totalRevenue)}
          icon={<PiggyBank className="w-5 h-5" />}
          color="success"
        />
        <StatCard
          title="Đã thanh toán"
          value={formatVND(totalPaid)}
          icon={<Wallet className="w-5 h-5" />}
          color="info"
        />
        <StatCard
          title="Công nợ"
          value={formatVND(outstandingDebt)}
          icon={<CreditCard className="w-5 h-5" />}
          color={outstandingDebt > 0 ? "danger" : "success"}
        />
        <StatCard
          title="Số giao dịch"
          value={transactionCount.toString()}
          icon={<Receipt className="w-5 h-5" />}
          color="warning"
        />
      </div>

      {/* Transaction History */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Lịch sử giao dịch</h2>
        {transactions.length === 0 ? (
          <EmptyState title="Chưa có giao dịch" description="Khách hàng chưa có giao dịch nào" />
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <Link key={transaction.id} href={`/sales/${transaction.id}`}>
                <Card className="hover:border-emerald-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {transaction.farm?.name || "N/A"}
                        </p>
                        <Badge
                          variant={
                            transaction.product_type === "heo_thit" ? "default" : "warning"
                          }
                        >
                          {getProductTypeLabel(transaction.product_type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(transaction.transaction_date)}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Số lượng: {" "}
                        <span className="font-medium">{transaction.quantity}</span>
                        {" "}con
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatVND(transaction.total_invoice)}
                      </p>
                      {transaction.outstanding_debt > 0 ? (
                        <Badge variant="danger" className="mt-1">
                          Nợ: {formatVND(transaction.outstanding_debt)}
                        </Badge>
                      ) : (
                        <Badge variant="success" className="mt-1">
                          Đã thanh toán
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Lịch sử thanh toán</h2>
        {payments.length === 0 ? (
          <EmptyState title="Chưa có thanh toán" description="Khách hàng chưa có lịch sử thanh toán nào" />
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <Card key={payment.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {getPaymentMethodLabel(payment.method)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(payment.payment_date)}
                    </p>
                    {payment.notes && (
                      <p className="text-sm text-gray-500 mt-1">{payment.notes}</p>
                    )}
                  </div>
                  <p className="font-semibold text-emerald-600">
                    +{formatVND(payment.amount)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
