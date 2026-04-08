"use client";

import { useState, useEffect } from "react";
import { CustomerSummary, Farm, PaymentMethod } from "@/lib/types/database";
import { FormField } from "./FormField";
import { SelectField } from "./SelectField";
import { formatVND, formatDate } from "@/lib/utils/format";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface PaymentFormProps {
  customer: CustomerSummary;
  farms: Farm[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface TransactionWithDebt {
  id: string;
  farm_id: string;
  outstanding_debt: number;
  total_invoice: number;
  transaction_date: string;
  farm?: { name: string }[];
}

const paymentMethodOptions = [
  { value: "cash", label: "Tiền mặt" },
  { value: "bank", label: "Chuyển khoản" },
  { value: "company", label: "Chuyển công ty" },
];

export function PaymentForm({ customer, farms, onSuccess, onCancel }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    amount: "",
    method: "cash" as PaymentMethod,
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerTransactions, setCustomerTransactions] = useState<TransactionWithDebt[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  useEffect(() => {
    fetchCustomerTransactions();
  }, [customer.customer_id]);

  const fetchCustomerTransactions = async () => {
    setIsLoadingTransactions(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("transactions")
      .select("id, farm_id, outstanding_debt, total_invoice, transaction_date, farm:farms(name)")
      .eq("customer_id", customer.customer_id)
      .gt("outstanding_debt", 0)
      .order("transaction_date", { ascending: true });

    if (error) {
      console.error("Error fetching transactions:", error);
    } else {
      setCustomerTransactions(data || []);
    }
    setIsLoadingTransactions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const amount = parseFloat(formData.amount);

    if (!formData.amount || isNaN(amount) || amount <= 0) {
      newErrors.amount = "Số tiền phải lớn hơn 0";
    } else if (amount > customer.outstanding_debt) {
      newErrors.amount = `Số tiền không được vượt quá công nợ (${formatVND(customer.outstanding_debt)})`;
    }

    if (!formData.payment_date) {
      newErrors.payment_date = "Vui lòng chọn ngày thanh toán";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      const amount = parseFloat(formData.amount);
      let remainingAmount = amount;

      // Start a transaction by inserting payment first
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .insert({
          customer_id: customer.customer_id,
          amount: amount,
          method: formData.method,
          payment_date: formData.payment_date,
          notes: formData.notes || null,
          transaction_id: null, // Will be updated later if needed
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update transactions - apply payment to oldest debts first
      for (const transaction of customerTransactions) {
        if (remainingAmount <= 0) break;

        const paymentForThisTransaction = Math.min(
          remainingAmount,
          transaction.outstanding_debt
        );

        const newOutstandingDebt = transaction.outstanding_debt - paymentForThisTransaction;
        const newTotalPaid = transaction.total_invoice - newOutstandingDebt;

        const { error: updateError } = await supabase
          .from("transactions")
          .update({
            outstanding_debt: newOutstandingDebt,
            total_paid: newTotalPaid,
          })
          .eq("id", transaction.id);

        if (updateError) throw updateError;

        remainingAmount -= paymentForThisTransaction;
      }

      onSuccess();
    } catch (error) {
      console.error("Error recording payment:", error);
      setErrors({ submit: "Có lỗi xảy ra khi ghi nhận thanh toán" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer Info (Read-only) */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div>
          <p className="text-sm text-gray-500">Khách hàng</p>
          <p className="font-medium text-gray-900">{customer.customer_name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Công nợ hiện tại</p>
          <p className="text-lg font-bold text-red-600">
            {formatVND(customer.outstanding_debt)}
          </p>
        </div>
      </div>

      {/* Outstanding Transactions */}
      {isLoadingTransactions ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span className="ml-2 text-sm text-gray-500">Đang tải giao dịch...</span>
        </div>
      ) : customerTransactions.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Giao dịch còn nợ:</p>
          <div className="max-h-32 overflow-y-auto space-y-2">
            {customerTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
              >
                <div>
                  <span className="font-medium">{tx.farm?.[0]?.name || "N/A"}</span>
                  <span className="text-gray-500 ml-2">
                    {formatDate(tx.transaction_date)}
                  </span>
                </div>
                <span className="text-red-600 font-medium">
                  {formatVND(tx.outstanding_debt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Payment Amount */}
      <FormField
        label="Số tiền thanh toán"
        name="amount"
        type="number"
        value={formData.amount}
        onChange={handleInputChange}
        error={errors.amount}
        required
        placeholder="Nhập số tiền"
        min={0}
        step={1000}
      />

      {/* Payment Method */}
      <SelectField
        label="Phương thức thanh toán"
        name="method"
        options={paymentMethodOptions}
        value={formData.method}
        onChange={handleInputChange}
        required
      />

      {/* Payment Date */}
      <FormField
        label="Ngày thanh toán"
        name="payment_date"
        type="date"
        value={formData.payment_date}
        onChange={handleInputChange}
        error={errors.payment_date}
        required
      />

      {/* Notes */}
      <FormField
        label="Ghi chú"
        name="notes"
        type="textarea"
        value={formData.notes}
        onChange={handleInputChange}
        placeholder="Nhập ghi chú (nếu có)"
      />

      {/* Error Message */}
      {errors.submit && (
        <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{errors.submit}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            "Xác nhận thanh toán"
          )}
        </button>
      </div>
    </form>
  );
}
