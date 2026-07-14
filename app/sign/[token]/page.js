"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";

const PdfSignerCanvas = dynamic(() => import("@/components/PdfSignerCanvas"), {
  ssr: false,
  loading: () => <p className="text-sm text-notary-400 py-10 text-center">Loading document…</p>,
});

export default function PublicSignPage() {
  const { token } = useParams();
  const [doc, setDoc] = useState(null);
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [justSigned, setJustSigned] = useState(false);
  const [placedFields, setPlacedFields] = useState([]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function load() {
    setLoading(true);
    try {
      setDoc(await api.publicGetDocument(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "This signing link could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePlace(field) {
    setError("");
    try {
      const created = await api.publicAddSignature(token, {
        ...field,
        signer_name: signerName.trim(),
        signer_email: signerEmail.trim(),
      });
      setPlacedFields((prev) => [...prev, created]);
      setJustSigned(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-parchment flex items-center justify-center">
        <p className="text-notary-400 text-sm">Loading…</p>
      </main>
    );
  }

  if (error && !doc) {
    return (
      <main className="min-h-screen bg-parchment flex items-center justify-center px-4">
        <div className="paper p-8 max-w-sm text-center">
          <p className="font-display text-xl text-notary-900 mb-2">Link unavailable</p>
          <p className="text-sm text-notary-400">{error}</p>
        </div>
      </main>
    );
  }

  if (doc.status === "SIGNED") {
    return (
      <main className="min-h-screen bg-parchment flex items-center justify-center px-4">
        <div className="paper p-8 max-w-sm text-center">
          <p className="seal-badge justify-center mb-2">Sealed & finalized</p>
          <p className="font-display text-xl text-notary-900 mb-2">This document is closed</p>
          <p className="text-sm text-notary-400">
            "{doc.original_filename}" has already been finalized and can no longer accept new signatures.
          </p>
        </div>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="min-h-screen bg-notary-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <p className="font-display text-2xl text-parchment tracking-wide">DocSign</p>
            <p className="text-notary-400 text-sm mt-1">You've been asked to sign</p>
          </div>
          <div className="bg-notary-900 border border-notary-800 rounded-lg p-6 space-y-4">
            <p className="text-sm text-notary-200 font-medium">{doc.original_filename}</p>
            <div>
              <label className="block text-xs text-notary-400 mb-1">Your full name</label>
              <input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full rounded border border-notary-700 bg-notary-800 px-3 py-2 text-sm text-parchment focus:outline-none focus:ring-2 focus:ring-seal-500"
                placeholder="Jane Signer"
              />
            </div>
            <div>
              <label className="block text-xs text-notary-400 mb-1">Your email</label>
              <input
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                className="w-full rounded border border-notary-700 bg-notary-800 px-3 py-2 text-sm text-parchment focus:outline-none focus:ring-2 focus:ring-seal-500"
                placeholder="jane@example.com"
              />
            </div>
            <button
              disabled={!signerName.trim() || !signerEmail.trim()}
              onClick={() => setReady(true)}
              className="w-full rounded bg-seal-600 hover:bg-seal-700 text-white font-medium text-sm py-2.5 disabled:opacity-50"
            >
              Continue to document
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-parchment">
      <header className="bg-notary-950 px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <p className="font-display text-lg text-parchment">DocSign</p>
          <p className="text-xs text-notary-400 mt-0.5">Signing as {signerName} ({signerEmail})</p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="font-display text-2xl text-notary-900 mb-1">{doc.original_filename}</h1>
        <p className="text-sm text-notary-400 mb-6">Click anywhere on the document to place your signature.</p>

        {justSigned && (
          <p className="text-sm text-seal-700 bg-seal-600/10 border border-seal-600/30 rounded px-3 py-2 mb-4">
            Signature added. You can place additional signatures if needed, or you're done — the document
            owner will finalize it once everyone has signed.
          </p>
        )}
        {error && (
          <p className="text-sm text-seal-600 bg-seal-600/10 border border-seal-600/30 rounded px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <PdfSignerCanvas
          fileUrl={api.publicFileUrl(token)}
          existingFields={placedFields}
          onPlace={handlePlace}
          signerLabel={signerName}
        />
      </div>
    </main>
  );
}
