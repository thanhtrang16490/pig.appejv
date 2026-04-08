"use client";

import { useState } from "react";
import { CustomerSummary } from "@/lib/types/database";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatVND } from "@/lib/utils/format";
import Link from "next/link";
import { MapPin, Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/forms/FormField";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface CustomerListClientProps {
  initialCustomers: CustomerSummary[];
}

export function CustomerListClient({ initialCustomers }: CustomerListClientProps) {
  const [customers, setCustomers] = useState<CustomerSummary[]>(initialCustomers);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerSummary[]>(initialCustomers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredCustomers(customers);
      return;
    }
    const filtered = customers.filter((c) =>
      c.customer_name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCustomers(filtered);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Vui lòng nhập tên khách hàng";
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
      const { data, error } = await supabase
        .from("customers")
        .insert({
          name: formData.name,
          address: formData.address || null,
          phone: formData.phone || null,
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add new customer to the list
      const newCustomer: CustomerSummary = {
        customer_id: data.id,
        customer_name: data.name,
        customer_address: data.address,
        total_revenue: 0,
        total_paid: 0,
        outstanding_debt: 0,
        transaction_count: 0,
      };

      setCustomers((prev) => [...prev, newCustomer]);
      setFilteredCustomers((prev) => [...prev, newCustomer]);
      setIsModalOpen(false);
      setFormData({ name: "", address: "", phone: "", notes: "" });
      router.refresh();
    } catch (error) {
      console.error("Error creating customer:", error);
      setErrors({ submit: "Có lỗi xảy ra khi thêm khách hàng" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <SearchInput
          placeholder="Tìm kiếm theo tên..."
          onSearch={handleSearch}
        />

        {filteredCustomers.length === 0 ? (
          <EmptyState
            title="Không tìm thấy khách hàng"
            description="Thử tìm kiếm với từ khóa khác hoặc thêm khách hàng mới"
            action={
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Thêm khách hàng
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((customer) => (
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
                        Doanh thu:{" "}
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
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thêm khách hàng mới"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Tên khách hàng"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={errors.name}
            required
            placeholder="Nhập tên khách hàng"
          />
          <FormField
            label="Địa chỉ"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Nhập địa chỉ"
          />
          <FormField
            label="Số điện thoại"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Nhập số điện thoại"
          />
          <FormField
            label="Ghi chú"
            name="notes"
            type="textarea"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Nhập ghi chú (nếu có)"
          />
          {errors.submit && (
            <p className="text-sm text-red-500">{errors.submit}</p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Đang lưu..." : "Thêm khách hàng"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
