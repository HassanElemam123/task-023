import { useEffect, useRef, useState } from "react";
import styles from "./SearchHero.module.css";

const popularTags = ["Nature", "Ocean", "City", "Mountains", "Sky"];

export default function SearchHero({ onResults }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

  const abortRef = useRef(null);
  const debounceRef = useRef(null);

  const searchPhotos = async (q) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    // cancel previous request (important for fast typing)
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(trimmed)}&per_page=12`,
        {
          headers: { Authorization: API_KEY },
          signal: abortRef.current.signal,
        }
      );

      const data = await res.json();
      onResults?.(data.photos || []);
    } catch (err) {
      // ignore abort errors
      if (err?.name !== "AbortError") {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setQuery("");
    if (abortRef.current) abortRef.current.abort();
    onResults?.([]);
  };

  useEffect(() => {
    if (!API_KEY) return;

    const q = query.trim();

    if (!q) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
      onResults?.([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchPhotos(q);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, API_KEY]);

  const onSubmit = (e) => {
    e.preventDefault();
    searchPhotos(query);
  };

  return (
    <section className={styles.searchContainer}>
      <div className={styles.inner}>
        <form className={styles.searchBar} onSubmit={onSubmit}>
          <span className={styles.icon} aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M10.5 19a8.5 8.5 0 1 1 0-17 8.5 8.5 0 0 1 0 17Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M16.8 16.8 21 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>

          <input
            className={styles.input}
            type="search"
            placeholder="Search for beautiful photos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>

          <button
            className={styles.resetButton}
            type="button"
            onClick={resetAll}
            disabled={!query && !loading}
            aria-label="Reset search"
          >
            Reset
          </button>
        </form>

        <div className={styles.popularRow}>
          <span className={styles.popularLabel}>Popular:</span>

          <div className={styles.pills}>
            {popularTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={styles.pill}
                onClick={() => {
                  setQuery(tag); 
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
