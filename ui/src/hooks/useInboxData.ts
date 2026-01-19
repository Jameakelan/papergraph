import { useState, useEffect, useCallback } from "react";

export type InboxItem = {
  id: number;
  subject: string;
  body: string;
  status: "unread" | "read" | "archived";
  created_at: string;
};

export function useInboxData() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false); // Default to false
  const [error, setError] = useState<string | null>(null);

  const fetchInbox = useCallback(async () => {
    try {
      const res = await fetch("/api/inbox");
      if (!res.ok) throw new Error("Failed to fetch inbox");
      const data = await res.json();
      setItems(data);
      setError(null);
    } catch (err: any) {
      console.error("Error loading inbox:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    if (isPolling) {
      intervalId = setInterval(() => {
        fetchInbox();
      }, 5000); // Poll every 5 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPolling, fetchInbox]);

  const togglePolling = () => setIsPolling((prev) => !prev);

  const markAsRead = async (id: number) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: "read" } : i))
    );

    try {
      await fetch("/api/inbox", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "read" }),
      });
    } catch (err) {
      console.error("Failed to mark as read", err);
      // Revert optimism if needed (complex, maybe skip for now)
    }
  };

  const deleteMessage = async (id: number) => {
    // Optimistic update
    setItems((prev) => prev.filter((i) => i.id !== id));

    try {
      await fetch(`/api/inbox?id=${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  return {
    items,
    loading,
    error,
    isPolling,
    togglePolling,
    refresh: fetchInbox,
    markAsRead,
    deleteMessage,
  };
}
