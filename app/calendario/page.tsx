import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function CalendarioPage() {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Calendário</h1>

          <div className="bg-white shadow rounded-lg p-6 h-[70vh]">
            <p className="text-gray-500">Eventos do calendário...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
