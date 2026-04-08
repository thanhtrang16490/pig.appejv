import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  User,
  MapPin,
  Package,
  Weight,
  DollarSign,
  FileText,
  Calculator,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Transaction, ProductType } from "@/lib/types/database";
import { formatDate, formatVND, formatNumber } from "@/lib/utils/format";
import { DeleteTransactionButton } from "./DeleteTransactionButton";

interface TransactionWithJoins extends Omit<Transaction, 'farm' | 'customer'> {
  farm: { name: string } | null;
  customer: { name: string; address: string | null; phone: string | null } | null;
}

interface TransactionDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getTransaction(id: string): Promise<TransactionWithJoins | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select(`
      *,
      farm:farms(name),
      customer:customers(name, address, phone)
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error fetching transaction:", error);
    return null;
  }

  return data;
}

function getProductTypeLabel(type: ProductType): string {
  switch (type) {
    case "heo_thit":
      return "Heo thịt";
    case "heo_con":
      return "Heo con";
    default:
      return type;
  }
}

function getProductTypeBadgeVariant(type: ProductType): "default" | "success" | "warning" | "danger" {
  switch (type) {
    case "heo_thit":
      return "success";
    case "heo_con":
      return "warning";
    default:
      return "default";
  }
}

function InfoRow({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-medium ${highlight ? "text-emerald-600" : "text-gray-900"}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

async function TransactionDetail({ id }: { id: string }) {
  const transaction = await getTransaction(id);

  if (!transaction) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <Badge variant={getProductTypeBadgeVariant(transaction.product_type)}>
            {getProductTypeLabel(transaction.product_type)}
          </Badge>
          <span className="text-sm text-gray-500">
            {formatDate(transaction.transaction_date)}
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">
            {transaction.customer?.name || "Không có tên"}
          </h2>
          {transaction.customer?.address && (
            <p className="text-sm text-gray-500">{transaction.customer.address}</p>
          )}
          {transaction.customer?.phone && (
            <p className="text-sm text-gray-500">{transaction.customer.phone}</p>
          )}
        </div>
      </Card>

      {/* Product Details */}
      <Card title="Chi tiết sản phẩm">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Số lượng</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatNumber(transaction.quantity)}
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Tổng trọng lượng</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatNumber(transaction.total_weight_kg)} kg
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Trọng lượng TB</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatNumber(transaction.avg_weight_kg)} kg
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Đơn giá</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatVND(transaction.unit_price)}
            </p>
          </div>
        </div>

        {transaction.excess_weight_kg > 0 && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-xs text-amber-600 mb-1">Cân dôi</p>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-amber-800">
                {formatNumber(transaction.excess_weight_kg)} kg ×{" "}
                {formatVND(transaction.excess_price_per_kg)}
              </span>
              <span className="text-sm font-semibold text-amber-800">
                {formatVND(transaction.excess_revenue)}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Financial Summary */}
      <Card title="Tổng kết tài chính">
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Doanh thu theo con</span>
            <span className="text-sm font-medium">
              {formatVND(transaction.revenue_by_count)}
            </span>
          </div>
          {transaction.excess_revenue > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Tiền cân dôi</span>
              <span className="text-sm font-medium">
                {formatVND(transaction.excess_revenue)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center py-3 bg-emerald-50 rounded-lg px-3">
            <span className="text-sm font-medium text-emerald-800">Tổng hóa đơn</span>
            <span className="text-lg font-bold text-emerald-700">
              {formatVND(transaction.total_invoice)}
            </span>
          </div>
        </div>
      </Card>

      {/* Payment Details */}
      <Card title="Chi tiết thanh toán">
        <div className="space-y-3">
          {transaction.payment_cash > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Tiền mặt</span>
              <span className="text-sm font-medium">
                {formatVND(transaction.payment_cash)}
              </span>
            </div>
          )}
          {transaction.payment_bank > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Chuyển khoản</span>
              <span className="text-sm font-medium">
                {formatVND(transaction.payment_bank)}
              </span>
            </div>
          )}
          {transaction.payment_company > 0 && (
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Chuyển công ty</span>
              <span className="text-sm font-medium">
                {formatVND(transaction.payment_company)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center py-2 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-700">Tổng thanh toán</span>
            <span className="text-sm font-semibold text-emerald-600">
              {formatVND(transaction.total_paid)}
            </span>
          </div>
          {transaction.outstanding_debt > 0 && (
            <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg">
              <span className="text-sm font-medium text-red-700">Công nợ</span>
              <span className="text-sm font-bold text-red-700">
                {formatVND(transaction.outstanding_debt)}
              </span>
            </div>
          )}
          {transaction.surplus > 0 && (
            <div className="flex justify-between items-center py-2 px-3 bg-emerald-50 rounded-lg">
              <span className="text-sm font-medium text-emerald-700">Thừa</span>
              <span className="text-sm font-bold text-emerald-700">
                {formatVND(transaction.surplus)}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Farm Info */}
      <Card title="Thông tin trại">
        <InfoRow
          icon={MapPin}
          label="Tên trại"
          value={transaction.farm?.name || "-"}
        />
      </Card>

      {/* Notes */}
      {transaction.notes && (
        <Card title="Ghi chú">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {transaction.notes}
          </p>
        </Card>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-400 text-center space-y-1">
        <p>Tạo lúc: {new Date(transaction.created_at).toLocaleString("vi-VN")}</p>
        <p>Cập nhật: {new Date(transaction.updated_at).toLocaleString("vi-VN")}</p>
      </div>
    </div>
  );
}

export default async function TransactionDetailPage({
  params,
}: TransactionDetailPageProps) {
  const { id } = await params;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/sales"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Quay lại danh sách
        </Link>

        <div className="flex gap-2">
          <DeleteTransactionButton id={id} />
          <Link
            href={`/sales/${id}/edit`}
            className="inline-flex items-center px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-1.5" />
            Sửa
          </Link>
        </div>
      </div>

      <PageHeader title="Chi tiết đơn hàng" />

      <Suspense fallback={<LoadingSpinner />}>
        <TransactionDetail id={id} />
      </Suspense>
    </div>
  );
}
