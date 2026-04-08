import { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatVND, formatNumber } from "@/lib/utils/format";
import { FarmSummary } from "@/lib/types/database";
import { Plus, MapPin, Users } from "lucide-react";
import { AddFarmModal } from "./AddFarmModal";

export const metadata: Metadata = {
  title: "Quản lý trại - Quản Lý Bán Heo",
  description: "Quản lý danh sách các trại heo",
};

interface FarmWithSummary extends Omit<FarmSummary, 'group_name'> {
  group_name?: string | null;
}

async function getFarms() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farm_summary")
    .select("*, farms(group_name)")
    .order("farm_name", { ascending: true });

  if (error) {
    console.error("Error fetching farms:", error);
    return [];
  }

  // Transform data to include group_name
  return (data as any[]).map((item) => ({
    farm_id: item.farm_id,
    farm_name: item.farm_name,
    group_name: item.farms?.group_name,
    total_revenue: item.total_revenue,
    total_quantity: item.total_quantity,
    total_weight_kg: item.total_weight_kg,
    transaction_count: item.transaction_count,
  })) as FarmWithSummary[] || [];
}

export default async function FarmsPage() {
  const farms = await getFarms();

  return (
    <div>
      <PageHeader
        title="Quản lý trại"
        action={<AddFarmModal />}
      />

      {farms.length === 0 ? (
        <EmptyState
          title="Chưa có trại nào"
          description="Thêm trại mới để bắt đầu quản lý"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {farms.map((farm) => (
            <Link key={farm.farm_id} href={`/farms/${farm.farm_id}`}>
              <Card className="h-full hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  {/* Farm Name */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {farm.farm_name}
                    </h3>
                    {farm.group_name && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Users className="w-4 h-4" />
                        <span>{farm.group_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">Doanh thu</p>
                      <p className="text-sm font-semibold text-emerald-600">
                        {formatVND(farm.total_revenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Số lượng</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatNumber(farm.total_quantity)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Giao dịch</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatNumber(farm.transaction_count)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
