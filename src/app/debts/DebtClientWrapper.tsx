"use client";

import { useState } from "react";
import { CustomerSummary, Farm } from "@/lib/types/database";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatVND } from "@/lib/utils/format";
import Link from "next/link";
import { MapPin, ChevronRight, Wallet } from "lucide-react";
import { PaymentForm } from "@/components/forms/PaymentForm";
import { Modal } from "@/components/ui/Modal";

interface DebtClientWrapperProps {
  initialDebts: CustomerSummary[];
  farms: Farm[];
}

export function DebtClientWrapper({ initialDebts, farms }: DebtClientWrapperProps) {
  const [debts, setDebts] = useState<CustomerSummary[]>(initialDebts);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handlePaymentSuccess = () => {
    // Refresh the debts list after payment
    window.location.reload();
  };

  const openPaymentModal = (customer: CustomerSummary) => {
    setSelectedCustomer(customer);
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedCustomer(null);
  };

  return (
    <>
      {/* Customer Debt List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Danh sách công nợ</h2>
        {debts.length === 0 ? (
          <EmptyState
            title="Không có công nợ"
            description="Tất cả khách hàng đã thanh toán đầy đủ"
          />
        ) : (
          <div className="space-y-3">
            {debts.map((debt) => (
              <Card key={debt.customer_id} className="group">
                <div className="flex items-start justify-between">
                  <Link
                    href={`/customers/${debt.customer_id}`}
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">
                          {debt.customer_name}
                        </h3>
                        {debt.customer_address && (
                          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{debt.customer_address}</span>
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mt-2">
                          Tổng doanh thu:{" "}
                          <span className="font-medium text-gray-900">
                            {formatVND(debt.total_revenue)}
                          </span>
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                  </Link>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Công nợ còn lại</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatVND(debt.outstanding_debt)}
                    </p>
                  </div>
                  <button
                    onClick={() => openPaymentModal(debt)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <Wallet className="w-4 h-4" />
                    Thanh toán
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        title="Ghi nhận thanh toán"
      >
        {selectedCustomer && (
          <PaymentForm
            customer={selectedCustomer}
            farms={farms}
            onSuccess={handlePaymentSuccess}
            onCancel={closePaymentModal}
          />
        )}
      </Modal>
    </>
  );
}
