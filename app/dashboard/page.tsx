import CardResumo from "../components/CardResumo";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function DashboardPage() {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardResumo title="Conversas Hoje" value={23} />
          <CardResumo title="Feedbacks Pendentes" value={7} />
          <CardResumo title="Clientes Ativos" value={18} />
        </div>
      </div>
    </div>
  );
}
