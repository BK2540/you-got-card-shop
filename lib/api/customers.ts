export async function getCustomers() {
  const res = await fetch("http://localhost:3000/api/customers", {
    cache: "no-store",
  });

  return res.json();
}