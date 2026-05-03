// context/FilterContext.tsx
"use client";

import { createContext, useState, ReactNode } from "react";

type FilterContextValue = {
  search: string;
  setSearch: (value: string) => void;
};

export const FilterContext = createContext<FilterContextValue>({
  search: "",
  setSearch: () => undefined,
});

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [search, setSearch] = useState("");

  return (
    <FilterContext.Provider value={{ search, setSearch }}>
      {children}
    </FilterContext.Provider>
  );
};
