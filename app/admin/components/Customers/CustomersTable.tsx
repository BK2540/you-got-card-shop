import type { CustomerListItem } from "@/lib/api/customers";

type CustomersTableProps = {
  customers: CustomerListItem[];
};

const CustomersTable = ({ customers }: CustomersTableProps) => {
  return (
    <div className="flex-1 space-y-10 p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-orange-500">Customers</h1>
        <p className="text-sm text-gray-300">
          Purchase history by customer with order IDs for follow-up.
        </p>
      </div>

      <div className="rounded-3xl bg-surface p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr>
                <th className="text-left">Customer</th>
                <th className="text-left">Email</th>
                <th className="text-left">Orders</th>
                <th className="text-left">Purchase History</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t border-gray-700 align-top">
                  <td className="py-3 font-semibold">{customer.name}</td>
                  <td className="py-3">{customer.email}</td>
                  <td className="py-3">{customer.orders.length}</td>
                  <td className="py-3">
                    {customer.orders.length === 0 ? (
                      <p className="text-xs text-gray-400">No purchases yet</p>
                    ) : (
                      <div className="space-y-2">
                        {customer.orders.map((order) => (
                          <div
                            key={order.id}
                            className="rounded-xl border border-white/10 bg-black/20 p-2"
                          >
                            <p className="font-mono text-xs text-orange-300">
                              Order ID: {order.id}
                            </p>
                            <p className="text-xs text-gray-300">
                              {order.status.replaceAll("_", " ")} | THB{" "}
                              {order.total.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-400">
                              Tracking: {order.trackingNumber || "-"}
                            </p>
                            <div className="mt-1 space-y-0.5">
                              {order.items.map((item) => (
                                <p key={item.id} className="text-xs text-gray-300">
                                  {item.card.name} x {item.quantity}
                                </p>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomersTable;
