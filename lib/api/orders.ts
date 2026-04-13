export async function getOrders() {
  const res = await fetch("http://localhost:3000/api/orders", {
    cache: "no-store",
  });

  return res.json();
}