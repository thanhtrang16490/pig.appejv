import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatVND } from "@/lib/utils/format";
import { CustomerSummary } from "@/lib/types/database";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, MapPin, Phone } from "lucide-react";
import { CustomerListClient } from "./CustomerListClient";

async function getCustomers(): Promise<CustomerSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_summary")
    .select("*")
    .order("customer_name");

  if (error) {
    console.error("Error fetching customers:", error);
    return [];
  }

  return data || [];
}

function CustomerList({ customers }: { customers: CustomerSummary[] }) {
  if (customers.length === 0) {
    return (
      <EmptyState
        title="Chưa có khách hàng"
        description="Thêm khách hàng mới để bắt đầu quản lý"
      />
    );
  }

  return (
    <div className="space-y-3">
      {customers.map((customer) => (
        <Link key={customer.customer_id} href={`/customers/${customer.customer_id}`}>
          <Card className="hover:border-emerald-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {customer.customer_name}
                </h3>
                {customer.customer_address && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{customer.customer_address}</span>
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  Doanh thu: {" "}
                  <span className="font-medium text-gray-900">
                    {formatVND(customer.total_revenue)}
                  </span>
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 ml-3">
                {customer.outstanding_debt > 0 ? (
                  <Badge variant="danger">
                    Nợ: {formatVND(customer.outstanding_debt)}
                  </Badge>
                ) : (
                  <Badge variant="success">Đã thanh toán</Badge>
                )}
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const customers = await getCustomers();
  const params = await searchParams;
  const searchQuery = typeof params.search === "string" ? params.search : "";

  const filteredCustomers = searchQuery
    ? customers.filter((c) =>
        c.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : customers;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Khách hàng"
        action={
          <Link
            href="/customers/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm khách hàng
          </Link>
        }
      />

      <CustomerListClient initialCustomers={filteredCustomers} />
    </div>
  );
}
