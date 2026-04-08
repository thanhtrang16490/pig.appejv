import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { TransactionFilters } from "@/components/forms/TransactionFilters";
import { Farm, ProductType, Transaction } from "@/lib/types/database";
import { SalesTransactionsClient } from "./SalesTransactionsClient";

interface TransactionWithJoins extends Omit<Transaction, 'farm' | 'customer'> {
  farm: { name: string } | null;
  customer: { name: string } | null;
}

interface SalesPageProps {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    farmId?: string;
    productType?: ProductType;
    customer?: string;
  }>;
}

async function getTransactions(
  filters: {
    dateFrom?: string;
    dateTo?: string;
    farmId?: string;
    productType?: ProductType;
    customer?: string;
  }
): Promise<TransactionWithJoins[]> {
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select(`
      *,
      farm:farms(name),
      customer:customers(name)
    `)
    .order("transaction_date", { ascending: false });

  if (filters.farmId) {
    query = query.eq("farm_id", filters.farmId);
  }

  if (filters.productType) {
    query = query.eq("product_type", filters.productType);
  }

  if (filters.dateFrom) {
    query = query.gte("transaction_date", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("transaction_date", filters.dateTo);
  }

  if (filters.customer) {
    // Search by customer name using the joined customer table
    query = query.ilike("customer.name", `%${filters.customer}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }

  return data || [];
}

async function getFarms(): Promise<Farm[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farms")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching farms:", error);
    return [];
  }

  return data || [];
}

async function TransactionsTable({
  filters,
}: {
  filters: SalesPageProps["searchParams"];
}) {
  const resolvedFilters = await filters;
  const transactions = await getTransactions(resolvedFilters);

  if (transactions.length === 0) {
    return (
      <EmptyState
        title="Chưa có đơn hàng"
        description="Bắt đầu bằng cách tạo đơn hàng mới"
        action={
          <Link
            href="/sales/new"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo đơn mới
          </Link>
        }
      />
    );
  }

  return <SalesTransactionsClient transactions={transactions} />;
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const farms = await getFarms();

  return (
    <div>
      <PageHeader
        title="Bán hàng"
        action={
          <Link
            href="/sales/new"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo đơn mới
          </Link>
        }
      />

      <TransactionFilters farms={farms} />

      <Suspense fallback={<LoadingSpinner />}>
        <TransactionsTable filters={searchParams} />
      </Suspense>
    </div>
  );
}
