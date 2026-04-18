type DashboardProps = {
  cardCount: number;
  orderCount: number;
  customerCount: number;
};

const Dashboard = ({
  cardCount,
  orderCount,
  customerCount,
}: DashboardProps) => {
  return (
    <main className="space-y-8 p-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-orange-400/80">
          Admin Overview
        </p>
        <h1 className="text-3xl font-bold text-orange-500">Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-surface p-6">
          <p className="text-sm text-gray-400">Inventory Count</p>
          <p className="mt-3 text-3xl font-bold text-white">{cardCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface p-6">
          <p className="text-sm text-gray-400">Orders Loaded</p>
          <p className="mt-3 text-3xl font-bold text-white">{orderCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-surface p-6">
          <p className="text-sm text-gray-400">Customers Loaded</p>
          <p className="mt-3 text-3xl font-bold text-white">{customerCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-surface p-6">
        <p className="text-lg font-semibold text-white">
          Choose a section from the sidebar to manage cards, orders, customers,
          and home content.
        </p>
      </div>
    </main>
  );
};

export default Dashboard;
