"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";

interface DeleteTransactionButtonProps {
  id: string;
}

export function DeleteTransactionButton({ id }: DeleteTransactionButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      router.push("/sales");
      router.refresh();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Có lỗi xảy ra khi xóa đơn hàng. Vui lòng thử lại.");
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-3 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
      >
        <Trash2 className="w-4 h-4 mr-1.5" />
        Xóa
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Xác nhận xóa"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Bạn có chắc chắn muốn xóa đơn hàng này? Hành động này không thể hoàn tác.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
