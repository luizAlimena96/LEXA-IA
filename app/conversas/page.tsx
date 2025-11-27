import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function ConversasPage() {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Conversas</h1>

          <div className="bg-white shadow rounded-lg p-4 h-[70vh]">
            <p className="text-gray-500">Lista de conversas...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
