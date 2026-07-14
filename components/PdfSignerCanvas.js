"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import SignaturePad from "./SignaturePad";

// Resolve the worker from a CDN, using whatever pdfjs-dist version react-pdf
// actually installed (pdfjs.version) — this keeps the API and worker
// versions in lockstep without relying on webpack's bundling of the
// local .mjs file, which can silently fail to load in some setups.


pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const DEFAULT_BOX = { width: 0.24, height: 0.055 };

/**
 * fileUrl: URL to fetch the PDF bytes from
 * existingFields: [{ id, page_number, x, y, width, height, field_type, value, signer_name }]
 * onPlace(field): called with { page_number, x, y, width, height, field_type, value } when
 *                  the user finishes placing a new signature. Omit to render read-only.
 * onRemove(fieldId): optional, shows a remove button on each placed field
 * signerLabel: name to attach as a text-signature default (e.g. current user's name)
 */
export default function PdfSignerCanvas({ fileUrl, authToken, existingFields = [], onPlace, onRemove, signerLabel }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(0); // 0-indexed to match backend
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [pendingClick, setPendingClick] = useState(null); // {xFrac, yFrac}
  const [mode, setMode] = useState(null); // null | "choose" | "draw"
  const [typedValue, setTypedValue] = useState(signerLabel || "");
  const [loadError, setLoadError] = useState("");

  const placingEnabled = typeof onPlace === "function";

  function handlePageClick(e) {
    if (!placingEnabled || !pageSize.width) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xFrac = (e.clientX - rect.left) / rect.width;
    const yFrac = (e.clientY - rect.top) / rect.height;
    setPendingClick({ xFrac, yFrac });
    setMode("choose");
  }

  function confirmTextSignature() {
    if (!typedValue.trim()) return;
    commitField("TEXT", typedValue.trim());
  }

  function commitField(fieldType, value) {
    const { xFrac, yFrac } = pendingClick;
    const width = DEFAULT_BOX.width;
    const height = DEFAULT_BOX.height;
    const x = Math.min(Math.max(xFrac - width / 2, 0), 1 - width);
    const y = Math.min(Math.max(yFrac - height / 2, 0), 1 - height);

    onPlace({ page_number: pageNumber, x, y, width, height, field_type: fieldType, value });
    setMode(null);
    setPendingClick(null);
  }

  const fieldsOnPage = existingFields.filter((f) => f.page_number === pageNumber);

  const fileSource = authToken
    ? { url: fileUrl, httpHeaders: { Authorization: `Bearer ${authToken}` } }
    : fileUrl;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pageNumber === 0}
            onClick={() => setPageNumber((p) => p - 1)}
            className="text-sm px-2 py-1 rounded border border-notary-200 disabled:opacity-40"
          >
            ‹ Prev
          </button>
          <span className="text-sm text-notary-600 tabular-nums">
            Page {pageNumber + 1} {numPages ? `of ${numPages}` : ""}
          </span>
          <button
            type="button"
            disabled={!numPages || pageNumber >= numPages - 1}
            onClick={() => setPageNumber((p) => p + 1)}
            className="text-sm px-2 py-1 rounded border border-notary-200 disabled:opacity-40"
          >
            Next ›
          </button>
        </div>
        {placingEnabled && (
          <p className="text-xs text-notary-400">Click anywhere on the page to place a signature</p>
        )}
      </div>

      {loadError && (
        <p className="text-sm text-seal-600 bg-seal-600/10 border border-seal-600/30 rounded px-3 py-2 mb-3">
          {loadError}
        </p>
      )}

      <div className="paper overflow-auto p-2 flex justify-center">
        <Document
          file={fileSource}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          onLoadError={(err) => {
            console.error("PDF load error:", err);
            setLoadError(`Could not load this PDF: ${err.message || "unknown error"}`);
          }}
          loading={<p className="text-sm text-notary-400 py-10">Loading document…</p>}
        >
          <div
            className={`relative ${placingEnabled ? "cursor-crosshair" : ""}`}
            onClick={handlePageClick}
          >
            <Page
              pageNumber={pageNumber + 1}
              width={720}
              onRenderSuccess={(page) => setPageSize({ width: page.width, height: page.height })}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />

            {/* Existing (already placed) signatures, positioned by fraction */}
            {fieldsOnPage.map((f) => (
              <div
                key={f.id ?? `${f.page_number}-${f.x}-${f.y}`}
                className="absolute border-2 border-seal-500/70 bg-seal-500/5 rounded flex items-center justify-center overflow-hidden"
                style={{
                  left: `${f.x * 100}%`,
                  top: `${f.y * 100}%`,
                  width: `${f.width * 100}%`,
                  height: `${f.height * 100}%`,
                }}
                title={f.signer_name || ""}
              >
                {f.field_type === "IMAGE" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.value} alt="Signature" className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="signature-ink text-xl px-1 truncate">{f.value}</span>
                )}
                {onRemove && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(f.id);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-notary-900 text-white text-xs leading-5"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {/* Marker for a click that's awaiting a type choice */}
            {pendingClick && mode === "choose" && (
              <div
                className="absolute border-2 border-dashed border-seal-600 rounded"
                style={{
                  left: `${(pendingClick.xFrac - DEFAULT_BOX.width / 2) * 100}%`,
                  top: `${(pendingClick.yFrac - DEFAULT_BOX.height / 2) * 100}%`,
                  width: `${DEFAULT_BOX.width * 100}%`,
                  height: `${DEFAULT_BOX.height * 100}%`,
                }}
              />
            )}
          </div>
        </Document>
      </div>

      {mode === "choose" && (
        <div className="paper p-4 mt-3 max-w-md">
          <p className="text-sm font-medium text-notary-900 mb-2">Add your signature</p>
          <div className="flex gap-2 mb-3">
            <input
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder="Type your name"
              className="flex-1 rounded border border-notary-200 px-3 py-2 text-sm signature-ink text-lg focus:outline-none focus:ring-2 focus:ring-seal-400"
            />
            <button
              type="button"
              onClick={confirmTextSignature}
              className="text-sm px-3 py-2 rounded bg-notary-900 text-white hover:bg-notary-800"
            >
              Use typed signature
            </button>
          </div>
          <button
            type="button"
            onClick={() => setMode("draw")}
            className="text-sm text-seal-600 hover:text-seal-700"
          >
            or draw it instead →
          </button>
          <button
            type="button"
            onClick={() => { setMode(null); setPendingClick(null); }}
            className="block text-xs text-notary-400 hover:text-notary-600 mt-2"
          >
            Cancel
          </button>
        </div>
      )}

      {mode === "draw" && (
        <div className="mt-3">
          <SignaturePad
            onSave={(dataUrl) => commitField("IMAGE", dataUrl)}
            onCancel={() => setMode("choose")}
          />
        </div>
      )}
    </div>
  );
}
