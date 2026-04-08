import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatVND } from "@/lib/utils/format";
import { CustomerSummary, Farm } from "@/lib/types/database";
import { DebtClientWrapper } from "./DebtClientWrapper";
import {
  Wallet,
  Users,
  Building2,
  ChevronRight,
} from "lucide-react";

interface FarmDebt {
  farm_id: string;
  farm_name: string;
  total_debt: number;
}

async function getDebts(): Promise<CustomerSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_summary")
    .select("*")
    .gt("outstanding_debt", 0)
    .order("outstanding_debt", { ascending: false });

  if (error) {
    console.error("Error fetching debts:", error);
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

async function getFarmDebts(): Promise<FarmDebt[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("farm_id, farms(name), outstanding_debt")
    .gt("outstanding_debt", 0);

  if (error) {
    console.error("Error fetching farm debts:", error);
    return [];
  }

  // Group by farm and sum debts
  const farmDebtMap = new Map<string, FarmDebt>();
  
  data?.forEach((item: any) => {
    const farmId = item.farm_id;
    const farmName = item.farms?.name || "Unknown";
    const debt = item.outstanding_debt || 0;
    
    if (farmDebtMap.has(farmId)) {
      const existing = farmDebtMap.get(farmId)!;
      existing.total_debt += debt;
    } else {
      farmDebtMap.set(farmId, {
        farm_id: farmId,
        farm_name: farmName,
        total_debt: debt,
      });
    }
  });

  return Array.from(farmDebtMap.values()).sort((a, b) => b.total_debt - a.total_debt);
}

export default async function DebtsPage() {
  const [debts, farms, farmDebts] = await Promise.all([
    getDebts(),
    getFarms(),
    getFarmDebts(),
  ]);

  const totalDebt = debts.reduce((sum, d) => sum + d.outstanding_debt, 0);
  const debtorsCount = debts.length;

  return (
    <div className="space-y-4">
      <PageHeader title="Quản lý công nợ" />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="Tổng công nợ"
          value={formatVND(totalDebt)}
          icon={<Wallet className="w-5 h-5" />}
          color="danger"
        />
        <StatCard
          title="Số khách nợ"
          value={debtorsCount.toString()}
          icon={<Users className="w-5 h-5" />}
          color="warning"
        />
      </div>

      {/* Debt by Farm */}
      {farmDebts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Công nợ theo trại</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {farmDebts.map((farmDebt) => (
              <Card key={farmDebt.farm_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{farmDebt.farm_name}</p>
                    <p className="text-sm text-red-600 font-semibold">
                      {formatVND(farmDebt.total_debt)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Client wrapper for interactive features */}
      <DebtClientWrapper 
        initialDebts={debts} 
        farms={farms}
      />
    </div>
  );
}
