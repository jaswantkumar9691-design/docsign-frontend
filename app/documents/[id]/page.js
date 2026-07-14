"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { isLoggedIn, clearToken } from "@/lib/auth";
import AuditTrail from "@/components/AuditTrail";

// react-pdf touches the DOM/canvas directly, so it can only run client-side.
const PdfSignerCanvas = dynamic(() => import("@/components/PdfSignerCanvas"), {
  ssr: false,
  loading: () => <p className="text-sm text-notary-400 py-10 text-center">Loading viewer…</p>,
});

export default function DocumentDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [doc, setDoc] = useState(null);
  const [fields, setFields] = useState([]);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [error, setError] = useState("");
  const [finalizing, setFinalizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    setToken(localStorage.getItem("docsign_token"));
    load();
    loadAudit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  async function load() {
    setLoading(true);
    try {
      const [d, f] = await Promise.all([api.getDocument(id), api.listSignatures(id)]);
      setDoc(d);
      setFields(f);
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

  async function loadAudit() {
    setAuditLoading(true);
    try {
      setAudit(await api.getAuditTrail(id));
    } catch (_) {
      /* non-critical */
    } finally {
      setAuditLoading(false);
    }
  }

  async function handlePlace(field) {
    setError("");
    try {
      await api.addSignature({ document_id: Number(id), ...field });
      await Promise.all([load(), loadAudit()]);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(fieldId) {
    try {
      await api.deleteSignatureField(fieldId);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleFinalize() {
    if (!confirm("Finalize this document? Signatures will be permanently embedded and no more can be added.")) return;
    setFinalizing(true);
    setError("");
    try {
      await api.finalizeDocument(id);
      await Promise.all([load(), loadAudit()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setFinalizing(false);
    }
  }

  function copyShareLink() {
    navigator.clipboard.writeText(doc.share_link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading || !doc) {
    return (
      <main className="min-h-screen bg-parchment flex items-center justify-center">
        <p className="text-notary-400 text-sm">{error || "Loading…"}</p>
      </main>
    );
  }

  const isSigned = doc.status === "SIGNED";

  return (
    <main className="min-h-screen bg-parchment">
      <header className="bg-notary-950 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/documents" className="font-display text-lg text-parchment hover:text-seal-300">
            DocSign
          </Link>
          <button onClick={() => router.push("/documents")} className="text-sm text-notary-400 hover:text-notary-200">
            ← All documents
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl text-notary-900">{doc.original_filename}</h1>
            <span className={`inline-block mt-1 text-xs font-medium px-2 py-1 rounded ${isSigned ? "bg-seal-600/10 text-seal-700" : "bg-notary-100 text-notary-600"}`}>
              {isSigned ? "Sealed & finalized" : "Pending signatures"}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => api.downloadFile(api.originalFileUrl(doc.id), doc.original_filename)}
              className="text-sm px-3 py-2 rounded border border-notary-200 text-notary-700 hover:bg-notary-50"
            >
              Download original
            </button>
            {isSigned && (
              <button
                onClick={() => api.downloadFile(api.signedFileUrl(doc.id), `signed-${doc.original_filename}`)}
                className="text-sm px-3 py-2 rounded bg-notary-900 text-white hover:bg-notary-800"
              >
                Download signed copy
              </button>
            )}
            {!isSigned && (
              <button
                onClick={handleFinalize}
                disabled={finalizing || fields.length === 0}
                className="text-sm px-3 py-2 rounded bg-seal-600 hover:bg-seal-700 text-white disabled:opacity-50"
              >
                {finalizing ? "Finalizing…" : "Finalize & seal"}
              </button>
            )}
          </div>
        </div>

        {!isSigned && (
          <div className="paper p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-medium text-notary-900">Shareable signing link</p>
              <p className="text-xs text-notary-400 mt-0.5">Anyone with this link can view and sign — no account needed.</p>
            </div>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-notary-50 border border-notary-200 rounded px-2 py-1.5 max-w-xs truncate">
                {doc.share_link}
              </code>
              <button onClick={copyShareLink} className="text-sm px-3 py-1.5 rounded bg-notary-900 text-white hover:bg-notary-800">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-seal-600 bg-seal-600/10 border border-seal-600/30 rounded px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <PdfSignerCanvas
          fileUrl={isSigned ? api.signedFileUrl(doc.id) : api.originalFileUrl(doc.id)}
          authToken={token}
          existingFields={isSigned ? [] : fields}
          onPlace={isSigned ? undefined : handlePlace}
          onRemove={isSigned ? undefined : handleRemove}
        />

        <h2 className="font-display text-lg text-notary-900 mt-10 mb-3">Audit trail</h2>
        <AuditTrail entries={audit} loading={auditLoading} />
      </div>
    </main>
  );
}
