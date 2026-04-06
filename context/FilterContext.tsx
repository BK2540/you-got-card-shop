// context/FilterContext.tsx
"use client";

import { createContext, useState, ReactNode } from "react";

export const FilterContext = createContext({
  search: "",
  setSearch: (v: string) => {},
});

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [search, setSearch] = useState("");

  return (
    <FilterContext.Provider value={{ search, setSearch }}>
      {children}
    </FilterContext.Provider>
  );
};
