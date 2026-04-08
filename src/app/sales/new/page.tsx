"use client";

import { useState, useEffect, useMemo, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calculator } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/forms/FormField";
import { SelectField } from "@/components/forms/SelectField";
import { calculateSale } from "@/lib/utils/calculations";
import { formatVND, formatNumber } from "@/lib/utils/format";
import { Farm, Customer, ProductType } from "@/lib/types/database";

interface FormData {
  transaction_date: string;
  farm_id: string;
  customer_id: string;
  product_type: ProductType;
  quantity: string;
  total_weight_kg: string;
  unit_price: string;
  excess_price_per_kg: string;
  payment_cash: string;
  payment_bank: string;
  payment_company: string;
  notes: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function NewSalePage() {
  const router = useRouter();
  const supabase = createClient();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState<FormData>({
    transaction_date: today,
    farm_id: "",
    customer_id: "",
    product_type: "heo_thit",
    quantity: "",
    total_weight_kg: "",
    unit_price: "",
    excess_price_per_kg: "",
    payment_cash: "0",
    payment_bank: "0",
    payment_company: "0",
    notes: "",
  });

  // Fetch farms and customers on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [farmsResult, customersResult] = await Promise.all([
          supabase.from("farms").select("*").order("name"),
          supabase.from("customers").select("*").order("name"),
        ]);

        if (farmsResult.data) setFarms(farmsResult.data);
        if (customersResult.data) setCustomers(customersResult.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  // Calculate derived values
  const calculations = useMemo(() => {
    const quantity = parseFloat(formData.quantity) || 0;
    const totalWeightKg = parseFloat(formData.total_weight_kg) || 0;
    const unitPrice = parseFloat(formData.unit_price) || 0;
    const excessPricePerKg = parseFloat(formData.excess_price_per_kg) || 0;
    const paymentCash = parseFloat(formData.payment_cash) || 0;
    const paymentBank = parseFloat(formData.payment_bank) || 0;
    const paymentCompany = parseFloat(formData.payment_company) || 0;

    return calculateSale({
      quantity,
      totalWeightKg,
      unitPrice,
      excessPricePerKg,
      paymentCash,
      paymentBank,
      paymentCompany,
    });
  }, [formData]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.transaction_date) {
      newErrors.transaction_date = "Vui lòng chọn ngày giao dịch";
    }
    if (!formData.farm_id) {
      newErrors.farm_id = "Vui lòng chọn trại";
    }
    if (!formData.customer_id) {
      newErrors.customer_id = "Vui lòng chọn khách hàng";
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      newErrors.quantity = "Vui lòng nhập số lượng hợp lệ";
    }
    if (!formData.total_weight_kg || parseFloat(formData.total_weight_kg) <= 0) {
      newErrors.total_weight_kg = "Vui lòng nhập tổng trọng lượng";
    }
    if (!formData.unit_price || parseFloat(formData.unit_price) <= 0) {
      newErrors.unit_price = "Vui lòng nhập đơn giá";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const transactionData = {
        transaction_date: formData.transaction_date,
        farm_id: formData.farm_id,
        customer_id: formData.customer_id,
        product_type: formData.product_type,
        quantity: parseFloat(formData.quantity),
        total_weight_kg: parseFloat(formData.total_weight_kg),
        avg_weight_kg: calculations.avgWeightKg,
        unit_price: parseFloat(formData.unit_price),
        revenue_by_count: calculations.revenueByCount,
        excess_weight_kg: calculations.excessWeightKg,
        excess_price_per_kg: parseFloat(formData.excess_price_per_kg) || 0,
        excess_revenue: calculations.excessRevenue,
        total_invoice: calculations.totalInvoice,
        payment_cash: parseFloat(formData.payment_cash) || 0,
        payment_bank: parseFloat(formData.payment_bank) || 0,
        payment_company: parseFloat(formData.payment_company) || 0,
        total_paid: calculations.totalPaid,
        outstanding_debt: calculations.outstandingDebt,
        surplus: calculations.surplus,
        notes: formData.notes || null,
      };

      const { error } = await supabase
        .from("transactions")
        .insert(transactionData);

      if (error) throw error;

      router.push("/sales");
      router.refresh();
    } catch (error) {
      console.error("Error creating transaction:", error);
      setErrors({ submit: "Có lỗi xảy ra khi lưu đơn hàng. Vui lòng thử lại." });
    } finally {
      setSubmitting(false);
    }
  };

  const farmOptions = farms.map((farm) => ({
    value: farm.id,
    label: farm.name,
  }));

  const customerOptions = customers.map((customer) => ({
    value: customer.id,
    label: customer.name,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/sales"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Quay lại danh sách
        </Link>
      </div>

      <PageHeader title="Tạo đơn bán hàng mới" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card title="Thông tin cơ bản">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Ngày giao dịch"
              name="transaction_date"
              type="date"
              value={formData.transaction_date}
              onChange={handleChange}
              error={errors.transaction_date}
              required
            />

            <SelectField
              label="Trại"
              name="farm_id"
              value={formData.farm_id}
              onChange={handleChange}
              options={farmOptions}
              placeholder="Chọn trại"
              error={errors.farm_id}
              required
            />

            <SelectField
              label="Khách hàng"
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              options={customerOptions}
              placeholder="Chọn khách hàng"
              error={errors.customer_id}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Loại sản phẩm <span className="text-red-500">*</span>
              </label>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, product_type: "heo_thit" }))
                  }
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    formData.product_type === "heo_thit"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Heo thịt
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, product_type: "heo_con" }))
                  }
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    formData.product_type === "heo_con"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Heo con
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Product Details */}
        <Card title="Chi tiết sản phẩm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Số lượng"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              error={errors.quantity}
              required
              min={1}
              placeholder="Nhập số lượng"
            />

            <FormField
              label="Tổng trọng lượng (kg)"
              name="total_weight_kg"
              type="number"
              value={formData.total_weight_kg}
              onChange={handleChange}
              error={errors.total_weight_kg}
              required
              min={0.1}
              step={0.1}
              placeholder="Nhập tổng trọng lượng"
            />

            <FormField
              label="Đơn giá (VNĐ/con)"
              name="unit_price"
              type="number"
              value={formData.unit_price}
              onChange={handleChange}
              error={errors.unit_price}
              required
              min={0}
              placeholder="Nhập đơn giá"
            />

            <FormField
              label="Giá cân dôi (VNĐ/kg)"
              name="excess_price_per_kg"
              type="number"
              value={formData.excess_price_per_kg}
              onChange={handleChange}
              min={0}
              placeholder="Nhập giá cân dôi"
            />
          </div>

          {/* Calculated Fields */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Kết quả tính toán
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Trọng lượng TB:</span>
                <p className="font-medium">{formatNumber(calculations.avgWeightKg)} kg</p>
              </div>
              <div>
                <span className="text-gray-500">Doanh thu theo con:</span>
                <p className="font-medium">{formatVND(calculations.revenueByCount)}</p>
              </div>
              <div>
                <span className="text-gray-500">Cân dôi:</span>
                <p className="font-medium">{formatNumber(calculations.excessWeightKg)} kg</p>
              </div>
              <div>
                <span className="text-gray-500">Tiền cân dôi:</span>
                <p className="font-medium">{formatVND(calculations.excessRevenue)}</p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <span className="text-gray-500">Tổng hóa đơn:</span>
                <p className="font-medium text-emerald-600">
                  {formatVND(calculations.totalInvoice)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Information */}
        <Card title="Thanh toán">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="Tiền mặt"
              name="payment_cash"
              type="number"
              value={formData.payment_cash}
              onChange={handleChange}
              min={0}
              placeholder="0"
            />

            <FormField
              label="Chuyển khoản"
              name="payment_bank"
              type="number"
              value={formData.payment_bank}
              onChange={handleChange}
              min={0}
              placeholder="0"
            />

            <FormField
              label="Chuyển công ty"
              name="payment_company"
              type="number"
              value={formData.payment_company}
              onChange={handleChange}
              min={0}
              placeholder="0"
            />
          </div>

          {/* Payment Summary */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Tổng thanh toán:</span>
                <p className="font-medium text-emerald-600">
                  {formatVND(calculations.totalPaid)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Công nợ:</span>
                <p
                  className={`font-medium ${
                    calculations.outstandingDebt > 0
                      ? "text-red-600"
                      : "text-gray-900"
                  }`}
                >
                  {formatVND(calculations.outstandingDebt)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Thừa:</span>
                <p
                  className={`font-medium ${
                    calculations.surplus > 0
                      ? "text-emerald-600"
                      : "text-gray-900"
                  }`}
                >
                  {formatVND(calculations.surplus)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card title="Ghi chú">
          <FormField
            label=""
            name="notes"
            type="textarea"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Nhập ghi chú (nếu có)"
          />
        </Card>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <Link
            href="/sales"
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors text-center"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-3 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Đang lưu..." : "Lưu đơn hàng"}
          </button>
        </div>
      </form>
    </div>
  );
}
