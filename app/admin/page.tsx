/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { createCard, deleteCard, getCards } from "@/lib/api/cards";
import { getCustomers } from "@/lib/api/customers";
import { getOrders } from "@/lib/api/orders";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [tab, setTab] = useState<"inventory" | "orders" | "customers">(
    "inventory",
  );

  const [form, setForm] = useState({
    name: "",
    team: "",
    price: 0,
    image: "",
    grade: "",
    year: 2024,
  });

  // fetch cards
  const fetchCards = async () => {
    const data = await getCards();
    return data;
  };

  useEffect(() => {
    if (tab === "inventory") {
      fetchCards();
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "orders") {
      getOrders().then(setOrders);
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "customers") {
      getCustomers().then(setCustomers);
    }
  }, [tab]);

  // create
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    await createCard(form);

    setForm({
      name: "",
      team: "",
      price: 0,
      image: "",
      grade: "",
      year: 2024,
    });

    await fetchCards();
    setLoading(false);
  };

  // delete
  const handleDelete = async (id: string) => {
    await deleteCard(id);
    fetchCards();
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* SIDEBAR */}
      <div className="space-y-4 text-sm">
        <p
          className={tab === "inventory" ? "text-orange-400" : "text-gray-400"}
          onClick={() => setTab("inventory")}
        >
          Inventory
        </p>

        <p
          className={tab === "orders" ? "text-orange-400" : "text-gray-400"}
          onClick={() => setTab("orders")}
        >
          Orders
        </p>

        <p
          className={tab === "customers" ? "text-orange-400" : "text-gray-400"}
          onClick={() => setTab("customers")}
        >
          Customers
        </p>
      </div>

      {/* MAIN */}
      {tab === "inventory" && (
        <main className="flex-1 p-8 space-y-10">
          <h1 className="text-2xl font-bold text-orange-500">
            Dashboard Overview
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* FORM */}
            <div className="bg-gray-900 p-6 space-y-4">
              <h2 className="text-lg font-bold">Add New Card</h2>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  placeholder="Name"
                  className="w-full p-2 text-black"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <input
                  placeholder="Team"
                  className="w-full p-2 text-black"
                  value={form.team}
                  onChange={(e) => setForm({ ...form, team: e.target.value })}
                />

                <input
                  type="number"
                  placeholder="Price"
                  className="w-full p-2 text-black"
                  value={form.price}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price: Number(e.target.value),
                    })
                  }
                />

                <input
                  placeholder="Image URL"
                  className="w-full p-2 text-black"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />

                <input
                  placeholder="Grade"
                  className="w-full p-2 text-black"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                />

                <input
                  type="number"
                  placeholder="Year"
                  className="w-full p-2 text-black"
                  value={form.year}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      year: Number(e.target.value),
                    })
                  }
                />

                <button className="w-full bg-orange-500 py-2">
                  {loading ? "Adding..." : "Add Card"}
                </button>
              </form>
            </div>

            {/* TABLE */}
            <div className="lg:col-span-2 bg-gray-900 p-6">
              <h2 className="text-lg font-bold mb-4">Active Inventory</h2>

              <table className="w-full text-sm">
                <thead className="text-gray-400">
                  <tr>
                    <th>Name</th>
                    <th>Grade</th>
                    <th>Price</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {cards.map((card) => (
                    <tr key={card.id} className="border-t border-gray-700">
                      <td className="py-2">{card.name}</td>
                      <td>{card.grade}</td>
                      <td>${card.price}</td>
                      <td>
                        <button
                          onClick={() => handleDelete(card.id)}
                          className="text-red-400"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {tab === "orders" && (
        <div className="bg-gray-900 p-6">
          <h2 className="text-lg font-bold mb-4">Orders</h2>

          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order: any) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer?.name}</td>
                  <td>${order.total}</td>
                  <td>{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "customers" && (
        <div className="bg-gray-900 p-6">
          <h2 className="text-lg font-bold mb-4">Customers</h2>

          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((c: any) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
