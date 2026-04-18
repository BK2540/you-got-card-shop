type Order = {
  id: string;
  total: number;
  status: string;
  customer?: {
    name?: string;
  };
};

type OrdersTableProps = {
  orders: Order[];
};

const OrdersTable = ({ orders }: OrdersTableProps) => {
  return (
    <div className="flex-1 space-y-10 p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-orange-500">Orders</h1>
      </div>

      <div className="rounded-3xl bg-surface p-6 shadow-xl">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">ID</th>
              <th className="text-left">Customer</th>
              <th className="text-left">Total</th>
              <th className="text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-gray-700">
                <td className="py-3">{order.id}</td>
                <td>{order.customer?.name ?? "-"}</td>
                <td>${order.total}</td>
                <td>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersTable;
