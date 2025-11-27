export default function LoginPage() {
  return (
    <main className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white shadow rounded-lg p-8 min-w-[380px]">
        <h1 className="text-2xl font-bold mb-6 text-center">Entrar</h1>

        <form className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="E-mail"
            className="border rounded p-3"
          />

          <input
            type="password"
            placeholder="Senha"
            className="border rounded p-3"
          />

          <button className="bg-blue-600 text-white p-3 rounded hover:bg-blue-700">
            Entrar
          </button>
        </form>
      </div>
    </main>
  );
}
