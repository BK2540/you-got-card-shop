/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/api/cards.ts

export async function getCards() {
  const res = await fetch("http://localhost:3000/api/cards", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch cards");
  }

  return res.json();
}

export async function createCard(data: any) {
  const res = await fetch("http://localhost:3000/api/cards", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function deleteCard(id: string) {
  await fetch(`http://localhost:3000/api/cards/${id}`, {
    method: "DELETE",
  });
}