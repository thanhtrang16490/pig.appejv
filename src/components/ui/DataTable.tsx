import { ReactNode } from "react";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  keyExtractor,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-3">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={`bg-white rounded-xl border border-gray-100 p-4 ${
              onRowClick ? "cursor-pointer active:scale-[0.98] transition-transform" : ""
            }`}
          >
            {columns.map((column, index) => (
              <div
                key={column.key}
                className={`flex justify-between items-center ${
                  index > 0 ? "mt-2 pt-2 border-t border-gray-50" : ""
                }`}
              >
                <span className="text-xs text-gray-500">{column.label}</span>
                <span className="text-sm font-medium text-gray-900">
                  {column.render ? column.render(item) : String((item as Record<string, unknown>)[column.key] ?? "-")}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`${
                  onRowClick
                    ? "cursor-pointer hover:bg-gray-50 transition-colors"
                    : ""
                }`}
              >
                {columns.map((column) => (
                  <td key={column.key} className="py-3 px-4 text-sm text-gray-900">
                    {column.render
                      ? column.render(item)
                      : String((item as Record<string, unknown>)[column.key] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
