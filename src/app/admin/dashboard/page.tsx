export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <h3 className="text-2xl font-semibold">Usuarios Activos</h3>
            <p className="text-4xl font-bold">128</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <h3 className="text-2xl font-semibold">Reservas Hoy</h3>
            <p className="text-4xl font-bold">24</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <h3 className="text-2xl font-semibold">Clases Programadas</h3>
            <p className="text-4xl font-bold">12</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6">
            <h3 className="text-2xl font-semibold">Ingresos del Mes</h3>
            <p className="text-4xl font-bold">€3,240</p>
          </div>
        </div>
      </div>
    </div>
  )
}
