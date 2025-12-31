import { LucideIcon, BarChart3 } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function CardResumo({
  title,
  value,
  subtitle,
  trend,
}: Props) {
  return (
    <div className="bg-white dark:bg-[#12121d] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800/50 card-hover transition-colors duration-300">
      <div className="flex flex-col">
        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
          {title}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{value}</h2>
          {subtitle && <span className="text-sm text-gray-400 dark:text-gray-500">{subtitle}</span>}
        </div>

        {trend && (
          <div
            className={`flex items-center gap-1 mt-3 text-sm font-medium ${trend.isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
          >
            <span>{trend.isPositive ? "↗" : "↘"}</span>
            <span>{trend.value}%</span>
            <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">vs último mês</span>
          </div>
        )}
      </div>
    </div>
  );
}
