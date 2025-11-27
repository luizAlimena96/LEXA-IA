interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function CardResumo({
  title,
  value,
  subtitle,
  icon = "📊",
  trend,
}: Props) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 font-medium text-sm uppercase tracking-wide">
            {title}
          </p>
          <h2 className="text-3xl font-bold mt-2 text-gray-900">{value}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}

          {trend && (
            <div
              className={`flex items-center gap-1 mt-2 text-sm ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              <span>{trend.isPositive ? "↗" : "↘"}</span>
              <span>{trend.value}%</span>
              <span className="text-gray-500">vs último mês</span>
            </div>
          )}
        </div>

        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
          <span className="text-white text-lg">{icon}</span>
        </div>
      </div>
    </div>
  );
}
