"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { isLoggedIn, clearToken } from "@/lib/auth";

const STATUS_STYLE = {
  PENDING: "bg-notary-100 text-notary-600",
  SIGNED: "bg-seal-600/10 text-seal-700",
};

export default function DocumentsPage() {
  const router = useRouter();
  const fileInput = useRef(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    load();
  }, [router]);

  async function load() {
    setLoading(true);
    try {
      setDocs(await api.listDocuments());
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.replace("/login");
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const doc = await api.uploadDocument(file);
      await load();
      router.push(`/documents/${doc.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this document permanently?")) return;
    try {
      await api.deleteDocument(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-parchment">
      <header className="bg-notary-950 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="font-display text-lg text-parchment">DocSign</p>
          <button
            onClick={() => { clearToken(); router.push("/login"); }}
            className="text-sm text-notary-400 hover:text-notary-200"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl text-notary-900">Your documents</h1>
            <p className="text-sm text-notary-400 mt-1">Upload a PDF, place signatures, and finalize a sealed copy.</p>
          </div>
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="rounded bg-seal-600 hover:bg-seal-700 text-white text-sm font-medium px-4 py-2.5 disabled:opacity-60"
          >
            {uploading ? "Uploading…" : "+ Upload PDF"}
          </button>
          <input ref={fileInput} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
        </div>

        {error && (
          <p className="text-sm text-seal-600 bg-seal-600/10 border border-seal-600/30 rounded px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-notary-400 text-sm">Loading…</p>
        ) : docs.length === 0 ? (
          <div className="paper border-dashed p-10 text-center">
            <p className="text-notary-900 font-display text-lg">No documents yet</p>
            <p className="text-sm text-notary-400 mt-1">Upload your first PDF to start collecting signatures.</p>
          </div>
        ) : (
          <div className="paper overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-notary-200 text-left text-xs text-notary-400 uppercase tracking-wide">
                  <th className="px-4 py-3">Document</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Signatures</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-t border-notary-100 hover:bg-notary-50 cursor-pointer" onClick={() => router.push(`/documents/${d.id}`)}>
                    <td className="px-4 py-3 text-notary-900 font-medium">{d.original_filename}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${STATUS_STYLE[d.status]}`}>
                        {d.status === "SIGNED" ? "Sealed" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-notary-600">{d.signature_count}</td>
                    <td className="px-4 py-3 text-notary-400">{new Date(d.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}
                        className="text-xs text-seal-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
