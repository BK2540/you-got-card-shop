// // app/card/[id]/page.tsx
// import { cards } from "@/data/mockData";

// export default function CardDetail({
//   params,
// }: {
//   params: { id: string };
// }) {
//   const card = cards.find((c) => c.id === params.id);

//   if (!card) return <div>Not found</div>;

//   return (
//     <div className="p-8">
//       <img src={card.image} />
//       <h1 className="text-3xl">{card.name}</h1>
//       <p>${card.price}</p>
//     </div>
//   );
// }
