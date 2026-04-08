"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Calendar, Filter } from "lucide-react";
import { Farm, ProductType } from "@/lib/types/database";

interface TransactionFiltersProps {
  farms: Farm[];
}

export function TransactionFilters({ farms }: TransactionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");
  const [farmId, setFarmId] = useState(searchParams.get("farmId") || "");
  const [productType, setProductType] = useState<ProductType | "">(
    (searchParams.get("productType") as ProductType) || ""
  );
  const [customerSearch, setCustomerSearch] = useState(
    searchParams.get("customer") || ""
  );

  // Apply filters when they change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (farmId) params.set("farmId", farmId);
    if (productType) params.set("productType", productType);
    if (customerSearch) params.set("customer", customerSearch);

    const queryString = params.toString();
    router.push(`/sales${queryString ? `?${queryString}` : ""}`);
  }, [dateFrom, dateTo, farmId, productType, customerSearch, router]);

  const handleClearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setFarmId("");
    setProductType("");
    setCustomerSearch("");
  };

  const hasActiveFilters = dateFrom || dateTo || farmId || productType || customerSearch;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 space-y-4">
      {/* Search and Product Type Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Customer Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên khách hàng..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Product Type Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setProductType("")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              productType === ""
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setProductType("heo_thit")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              productType === "heo_thit"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Heo thịt
          </button>
          <button
            onClick={() => setProductType("heo_con")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              productType === "heo_con"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Heo con
          </button>
        </div>
      </div>

      {/* Date Range and Farm Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Date From */}
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="date"
            placeholder="Từ ngày"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Date To */}
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="date"
            placeholder="Đến ngày"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Farm Selector */}
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={farmId}
            onChange={(e) => setFarmId(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
          >
            <option value="">Tất cả trại</option>
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            onClick={handleClearFilters}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}
