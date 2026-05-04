"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";

type CardsFilterPanelProps = {
  search: string;
  playerName: string;
  team: string;
  year: string;
  grade: string;
  minPrice: string;
  maxPrice: string;
  teams: string[];
  years: string[];
  grades: string[];
};

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

const subscribeToHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerSnapshot = () => false;

export default function CardsFilterPanel({
  search,
  playerName,
  team,
  year,
  grade,
  minPrice,
  maxPrice,
  teams,
  years,
  grades,
}: CardsFilterPanelProps) {
  const [open, setOpen] = useState(true);
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerSnapshot,
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Filters
          <ChevronIcon open={open} />
        </button>
      </div>

      {open && mounted && (
        <form
          method="GET"
          className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
        >
          <input type="hidden" name="page" value="1" />

          <input
            name="search"
            defaultValue={search}
            placeholder="Search card/team/player/grade"
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none"
          />
          <input
            name="playerName"
            defaultValue={playerName}
            placeholder="Player name"
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none"
          />
          <select
            name="team"
            defaultValue={team}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none"
          >
            <option value="">All teams</option>
            {teams.map((item) => (
              <option key={item} value={item} className="bg-surface">
                {item}
              </option>
            ))}
          </select>
          <select
            name="year"
            defaultValue={year}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none"
          >
            <option value="">All years</option>
            {years.map((item) => (
              <option key={item} value={item} className="bg-surface">
                {item}
              </option>
            ))}
          </select>
          <select
            name="grade"
            defaultValue={grade}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none"
          >
            <option value="">All grades</option>
            {grades.map((item) => (
              <option key={item} value={item} className="bg-surface">
                {item}
              </option>
            ))}
          </select>
          <input
            name="minPrice"
            defaultValue={minPrice}
            inputMode="numeric"
            placeholder="Min price"
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none"
          />
          <input
            name="maxPrice"
            defaultValue={maxPrice}
            inputMode="numeric"
            placeholder="Max price"
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 outline-none"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-4 py-2 font-semibold text-white transition hover:opacity-90"
            >
              Apply
            </button>
            <Link
              href="/cards"
              className="w-full rounded-xl border border-white/10 px-4 py-2 text-center font-semibold text-white transition hover:bg-white/10"
            >
              Reset
            </Link>
          </div>
        </form>
      )}
    </section>
  );
}
