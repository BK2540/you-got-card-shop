import CardItem from "@/components/CardItem";
import CardsCarousel from "@/components/cards/CardsCarousel";
import CardsFilterPanel from "@/components/cards/CardsFilterPanel";
import { getCards } from "@/lib/api/cards";
import { Card } from "@/types";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const readQueryValue = (
  params: { [key: string]: string | string[] | undefined },
  key: string,
) => {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
};

export default async function CardsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(readQueryValue(params, "page") || "1"));
  const search = readQueryValue(params, "search");
  const team = readQueryValue(params, "team");
  const year = readQueryValue(params, "year");
  const grade = readQueryValue(params, "grade");
  const playerName = readQueryValue(params, "playerName");
  const minPrice = readQueryValue(params, "minPrice");
  const maxPrice = readQueryValue(params, "maxPrice");

  const filterOptions = {
    search,
    team,
    year,
    grade,
    playerName,
    minPrice,
    maxPrice,
  };

  const [catalogCards, allCards, recommendedCards, newArrivalCards] =
    await Promise.all([
      getCards(),
      getCards(filterOptions),
      getCards({ ...filterOptions, section: "recommended", limit: 8 }),
      getCards({ ...filterOptions, section: "new-arrival", limit: 8 }),
    ]);

  const teams = Array.from(
    new Set(catalogCards.map((card: Card) => card.team)),
  ).sort();
  const years = Array.from(
    new Set(catalogCards.map((card: Card) => String(card.year))),
  ).sort((a, b) => Number(b) - Number(a));
  const grades = Array.from(
    new Set(catalogCards.map((card: Card) => card.grade)),
  ).sort();

  const itemsPerPage = 9;
  const totalPages = Math.max(1, Math.ceil(allCards.length / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCards = allCards.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage,
  );

  const createPageHref = (page: number) => {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    if (playerName) query.set("playerName", playerName);
    if (team) query.set("team", team);
    if (year) query.set("year", year);
    if (grade) query.set("grade", grade);
    if (minPrice) query.set("minPrice", minPrice);
    if (maxPrice) query.set("maxPrice", maxPrice);
    query.set("page", String(page));

    return `/cards?${query.toString()}`;
  };

  const sectionTitleClass =
    "bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent text-2xl sm:text-3xl lg:text-4xl font-bold";

  return (
    <main className="space-y-10 px-4 py-10 text-white sm:px-6 lg:px-16">
      <CardsFilterPanel
        search={search}
        playerName={playerName}
        team={team}
        year={year}
        grade={grade}
        minPrice={minPrice}
        maxPrice={maxPrice}
        teams={teams}
        years={years}
        grades={grades}
      />

      <section className="space-y-5">
        <h2 className={sectionTitleClass}>Recommended</h2>
        {recommendedCards.length === 0 ? (
          <p className="text-sm text-gray-400">
            No recommended cards match current filters.
          </p>
        ) : (
          <CardsCarousel cards={recommendedCards} />
        )}
      </section>

      <section className="space-y-5">
        <h2 className={sectionTitleClass}>New Arrival</h2>
        {newArrivalCards.length === 0 ? (
          <p className="text-sm text-gray-400">
            No new arrivals match current filters.
          </p>
        ) : (
          <CardsCarousel cards={newArrivalCards} />
        )}
      </section>

      <section className="space-y-5">
        <h2 className={sectionTitleClass}>All Cards</h2>
        {paginatedCards.length === 0 ? (
          <p className="text-sm text-gray-400">No cards match your filters.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
            {paginatedCards.map((card: Card) => (
              <CardItem key={card.id} card={card} />
            ))}
          </div>
        )}

        {allCards.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href={createPageHref(Math.max(1, safePage - 1))}
              className={`rounded-xl border border-white/10 px-4 py-2 text-sm transition ${
                safePage === 1
                  ? "pointer-events-none opacity-40"
                  : "hover:bg-white/10"
              }`}
            >
              Previous
            </Link>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (page) => (
                <Link
                  key={page}
                  href={createPageHref(page)}
                  className={`rounded-xl px-4 py-2 text-sm transition ${
                    page === safePage
                      ? "bg-primary text-white"
                      : "border border-white/10 text-white hover:bg-white/10"
                  }`}
                >
                  {page}
                </Link>
              ),
            )}

            <Link
              href={createPageHref(Math.min(totalPages, safePage + 1))}
              className={`rounded-xl border border-white/10 px-4 py-2 text-sm transition ${
                safePage === totalPages
                  ? "pointer-events-none opacity-40"
                  : "hover:bg-white/10"
              }`}
            >
              Next
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
