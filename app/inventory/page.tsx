// app/inventory/page.tsx
import CardItem from "@/components/CardItem";
import { getCards } from "@/lib/api/cards";

export default async function Inventory() {
  const cards = await getCards();

  return (
    <div className="grid grid-cols-2 gap-4 px-8">
      <h1>Inventory</h1>
      {cards &&
        cards.map((card: any) => <CardItem key={card.id} card={card} />)}
    </div>
  );
}
