import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  icon?: ReactNode;
  trend?: string;
  color?: "default" | "success" | "danger" | "warning" | "info";
}

const colorClasses = {
  default: "bg-gray-50 text-gray-600",
  success: "bg-green-50 text-green-600",
  danger: "bg-red-50 text-red-600",
  warning: "bg-amber-50 text-amber-600",
  info: "bg-blue-50 text-blue-600",
};

export function StatCard({
  title,
  value,
  icon,
  trend,
  color = "default",
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p
              className={`text-xs mt-1 ${
                trend.startsWith("+")
                  ? "text-green-600"
                  : trend.startsWith("-")
                  ? "text-red-500"
                  : "text-gray-500"
              }`}
            >
              {trend}
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        )}
      </div>
    </div>
  );
}
