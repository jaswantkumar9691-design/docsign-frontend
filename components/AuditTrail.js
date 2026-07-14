"use client";

const ACTION_LABEL = {
  UPLOADED: "Uploaded",
  VIEWED: "Viewed",
  SIGNATURE_ADDED: "Signature added",
  FINALIZED: "Finalized & sealed",
  DELETED: "Deleted",
};

export default function AuditTrail({ entries, loading }) {
  return (
    <div className="paper overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-notary-200 text-left text-xs text-notary-400 uppercase tracking-wide">
            <th className="px-4 py-3">When</th>
            <th className="px-4 py-3">Actor</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Detail</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={4} className="px-4 py-6 text-notary-400">Loading…</td></tr>
          ) : entries.length === 0 ? (
            <tr><td colSpan={4} className="px-4 py-6 text-notary-400">No activity yet.</td></tr>
          ) : (
            entries.map((e) => (
              <tr key={e.id} className="border-t border-notary-100">
                <td className="px-4 py-3 text-notary-400 whitespace-nowrap">
                  {new Date(e.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-notary-700">{e.actor}</td>
                <td className="px-4 py-3">
                  <span className="seal-badge">{ACTION_LABEL[e.action] || e.action}</span>
                </td>
                <td className="px-4 py-3 text-notary-400">{e.detail || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
