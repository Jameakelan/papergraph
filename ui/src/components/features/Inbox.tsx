import { useState } from "react";
import { Card } from "../ui/Card";
import { useInboxData, type InboxItem } from "../../hooks/useInboxData";
import { Wifi, WifiOff } from "lucide-react";

export function Inbox() {
  const {
    items,
    loading,
    isPolling,
    togglePolling,
    markAsRead,
    deleteMessage,
  } = useInboxData();
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);

  const handleOpen = (item: InboxItem) => {
    setSelectedItem(item);
    if (item.status === "unread") {
      markAsRead(item.id);
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this message?")) return;
    setSelectedItem(null);
    deleteMessage(id);
  };

  if (loading && items.length === 0) {
    return (
      <Card title="Inbox" className="animate-pulse">
        <div className="h-20 bg-gray-100 rounded"></div>
      </Card>
    );
  }

  return (
    <>
      <Card
        title={
          <div className="flex items-center gap-2">
            <span>Inbox</span>
            <button
              onClick={togglePolling}
              className={`p-2 rounded-full transition-colors ${
                isPolling
                  ? "bg-green-100 text-green-600 hover:bg-green-200"
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
              title={
                isPolling ? "Real-time updates ON" : "Real-time updates OFF"
              }
            >
              {isPolling ? <Wifi size={16} /> : <WifiOff size={16} />}
            </button>
          </div>
        }
      >
        {items.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-4">
            No new messages.
          </div>
        ) : (
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpen(item)}
                className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${
                  item.status === "unread"
                    ? "bg-[var(--color-bg-surface-hover)] border-[var(--color-primary)]/50"
                    : "border-[var(--color-border)] opacity-70"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-sm">{item.subject}</h4>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] line-clamp-2">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-[var(--color-bg-app)] border border-[var(--color-border)] rounded-xl shadow-2xl w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold mb-2 pr-8">
              {selectedItem.subject}
            </h3>
            <div className="text-xs text-[var(--color-text-muted)] mb-4 flex justify-between">
              <span>{new Date(selectedItem.created_at).toLocaleString()}</span>
              <span className="capitalize px-2 py-0.5 rounded bg-[var(--color-bg-surface-hover)]">
                {selectedItem.status}
              </span>
            </div>

            <div className="prose prose-sm max-w-none mb-6 text-[var(--color-text-main)] whitespace-pre-wrap">
              {selectedItem.body}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
              <button
                onClick={() => handleDelete(selectedItem.id)}
                className="px-4 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:brightness-110 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
