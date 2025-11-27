import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function WhatsappPage() {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1">
        <Topbar />

        <div className="p-6 flex gap-4">
          <div className="w-1/3 bg-white shadow rounded-lg p-4 h-[75vh]">
            <p className="text-gray-500">Contatos...</p>
          </div>

          <div className="flex-1 bg-white shadow rounded-lg p-4 h-[75vh]">
            <p className="text-gray-500 mb-4">Chat selecionado...</p>

            <div className="flex flex-col gap-3 overflow-y-auto h-full">
              <div className="bg-gray-200 p-3 rounded max-w-xs">
                mensagem...
              </div>
              <div className="bg-blue-600 text-white p-3 rounded self-end max-w-xs">
                resposta...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
