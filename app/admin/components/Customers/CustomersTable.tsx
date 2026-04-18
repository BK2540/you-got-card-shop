type Customer = {
  id: string;
  name: string;
  email: string;
};

type CustomersTableProps = {
  customers: Customer[];
};

const CustomersTable = ({ customers }: CustomersTableProps) => {
  return (
    <div className="flex-1 space-y-10 p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-orange-500">Customers</h1>
      </div>

      <div className="rounded-3xl bg-surface p-6 shadow-xl">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">Name</th>
              <th className="text-left">Email</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className="border-t border-gray-700">
                <td className="py-3">{customer.name}</td>
                <td>{customer.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomersTable;
