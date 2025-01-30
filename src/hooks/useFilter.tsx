import { useState, useEffect } from "react";

function useFilter<T>(
  items: T[],
  key: keyof T,
  delay: number = 1000
): [T[], (keyword: string) => void] {
  const [filteredItems, setFilteredItems] = useState<T[]>(items);
  const [keyword, setKeyword] = useState<string>("");
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [keyword, delay]);

  useEffect(() => {
    if (debouncedKeyword === "") {
      setFilteredItems(items);
    } else {
      const lowercasedKeyword = debouncedKeyword.toLowerCase();
      setFilteredItems(
        items.filter((item) =>
          String(item[key]).toLowerCase().startsWith(lowercasedKeyword)
        )
      );
    }
  }, [debouncedKeyword, items, key]);

  const doFiltration = (newKeyword: string) => {
    setKeyword(newKeyword.trim());
  };

  return [filteredItems, doFiltration];
}

export default useFilter;
