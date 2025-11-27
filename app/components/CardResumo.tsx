interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
}

export default function CardResumo({ title, value, subtitle }: Props) {
  return (
    <div className="bg-white shadow rounded-lg p-5">
      <p className="text-gray-600 font-medium">{title}</p>
      <h2 className="text-3xl font-bold mt-2">{value}</h2>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}
