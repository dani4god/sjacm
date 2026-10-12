"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export function useAdminList<T>(
  endpoint: string,
  page: number,
  q = "",
  revision = 0,
) {
  const router = useRouter();
  const [records, setRecords] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loadedKey, setLoadedKey] = useState("");
  const key = `${endpoint}:${page}:${q}:${revision}`;
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${endpoint}?page=${page}&q=${encodeURIComponent(q)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/login");
          router.refresh();
          return;
        }
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (controller.signal.aborted) return;
        setRecords(data.records);
        setTotal(data.total);
        setError("");
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : "Unable to load.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadedKey(key);
      });
    return () => controller.abort();
  }, [endpoint, page, q, revision, key, router]);
  return {
    records: loadedKey === key ? records : [],
    total,
    error: loadedKey === key ? error : "",
    loading: loadedKey !== key,
  };
}
