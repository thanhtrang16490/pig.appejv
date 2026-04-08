import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatVND, formatNumber, formatDate, formatWeight } from "@/lib/utils/format";
import { Farm, Transaction } from "@/lib/types/database";
import { 
  MapPin, 
  Users, 
  ArrowLeft, 
  TrendingUp, 
  Scale, 
  PiggyBank, 
  Receipt,
  Edit
} from "lucide-react";
import { EditFarmModal } from "./EditFarmModal";

interface TransactionWithCustomer extends Omit<Transaction, 'customer'> {
  customer?: {
    name: string;
  };
}

interface FarmDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getFarm(id: string): Promise<Farm | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farms")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Farm;
}

async function getFarmTransactions(id: string): Promise<TransactionWithCustomer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, customer:customers(name)")
    .eq("farm_id", id)
    .order("transaction_date", { ascending: false });

  if (error) {
    console.error("Error fetching farm transactions:", error);
    return [];
  }

  return (data as TransactionWithCustomer[]) || [];
}

async function getFarmSummary(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farm_summary")
    .select("*")
    .eq("farm_id", id)
    .single();

  if (error) {
    console.error("Error fetching farm summary:", error);
    return null;
  }

  return data;
}

function getProductTypeLabel(type: string): string {
  return type === "heo_thit" ? "Heo thịt" : "Heo con";
}

function getProductTypeBadgeVariant(type: string): "default" | "success" | "warning" | "danger" {
  return type === "heo_thit" ? "success" : "warning";
}

export async function generateMetadata({ params }: FarmDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const farm = await getFarm(id);
  
  return {
    title: farm ? `${farm.name} - Quản Lý Bán Heo` : "Chi tiết trại - Quản Lý Bán Heo",
    description: "Chi tiết thông tin trại heo",
  };
}

export default async function FarmDetailPage({ params }: FarmDetailPageProps) {
  const { id } = await params;
  const [farm, transactions, summary] = await Promise.all([
    getFarm(id),
    getFarmTransactions(id),
    getFarmSummary(id),
  ]);

  if (!farm) {
    notFound();
  }

  return (
    <div>
      {/* Back Link */}
      <Link 
        href="/farms" 
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách trại
      </Link>

      {/* Farm Info Card */}
      <Card className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{farm.name}</h1>
            <div className="mt-2 space-y-1">
              {farm.group_name && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{farm.group_name}</span>
                </div>
              )}
              {farm.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{farm.location}</span>
                </div>
              )}
            </div>
          </div>
          <EditFarmModal farm={farm} />
        </div>
      </Card>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Tổng doanh thu"
            value={formatVND(summary.total_revenue)}
            icon={<TrendingUp className="w-5 h-5" />}
            color="success"
          />
          <StatCard
            title="Tổng số lượng"
            value={formatNumber(summary.total_quantity)}
            icon={<PiggyBank className="w-5 h-5" />}
            color="default"
          />
          <StatCard
            title="Tổng trọng lượng"
            value={formatWeight(summary.total_weight_kg)}
            icon={<Scale className="w-5 h-5" />}
            color="default"
          />
          <StatCard
            title="Số giao dịch"
            value={formatNumber(summary.transaction_count)}
            icon={<Receipt className="w-5 h-5" />}
            color="default"
          />
        </div>
      )}

      {/* Transaction History */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Lịch sử giao dịch
        </h2>

        {transactions.length === 0 ? (
          <EmptyState
            title="Chưa có giao dịch"
            description="Trại này chưa có giao dịch nào"
          />
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <Link key={transaction.id} href={`/sales/${transaction.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(transaction.transaction_date)}
                        </span>
                        <Badge variant={getProductTypeBadgeVariant(transaction.product_type)}>
                          {getProductTypeLabel(transaction.product_type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {transaction.customer?.name || "Khách hàng không xác định"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600">
                        {formatVND(transaction.total_invoice)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.quantity} con · {formatWeight(transaction.total_weight_kg)}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
