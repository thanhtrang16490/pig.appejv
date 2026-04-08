"use client";

import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatVND, formatNumber } from "@/lib/utils/format";
import { ProductType } from "@/lib/types/database";

interface TransactionRow {
  id: string;
  transaction_date: string;
  product_type: ProductType;
  quantity: number;
  total_invoice: number;
  outstanding_debt: number;
  farm: { name: string } | null;
  customer: { name: string } | null;
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

const columns = [
  {
    key: "transaction_date",
    label: "Ngày",
    render: (item: TransactionRow) => formatDate(item.transaction_date),
  },
  {
    key: "customer",
    label: "Khách hàng",
    render: (item: TransactionRow) => item.customer?.name || "-",
  },
  {
    key: "farm",
    label: "Trại",
    render: (item: TransactionRow) => item.farm?.name || "-",
  },
  {
    key: "product_type",
    label: "Loại",
    render: (item: TransactionRow) => (
      <Badge variant={getProductTypeBadgeVariant(item.product_type)}>
        {getProductTypeLabel(item.product_type)}
      </Badge>
    ),
  },
  {
    key: "quantity",
    label: "Số lượng",
    render: (item: TransactionRow) => formatNumber(item.quantity),
  },
  {
    key: "total_invoice",
    label: "Tổng hóa đơn",
    render: (item: TransactionRow) => (
      <span className="font-medium">{formatVND(item.total_invoice)}</span>
    ),
  },
  {
    key: "outstanding_debt",
    label: "Công nợ",
    render: (item: TransactionRow) => (
      <span className={item.outstanding_debt > 0 ? "text-red-600 font-medium" : "text-gray-500"}>
        {formatVND(item.outstanding_debt)}
      </span>
    ),
  },
];

export function SalesTransactionsClient({ transactions }: { transactions: TransactionRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={transactions}
      keyExtractor={(item) => item.id}
      linkPrefix="/sales/"
    />
  );
}
