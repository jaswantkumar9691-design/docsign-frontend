"use client";
import { useEffect, useRef, useState } from "react";

/**
 * A simple draw-your-signature pad. Exports the drawing as a base64 PNG
 * via onSave(dataUrl) when the user confirms it.
 */
export default function SignaturePad({ onSave, onCancel }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#131c33";
  }, []);

  function pos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  }

  function start(e) {
    e.preventDefault();
    drawing.current = true;
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function move(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const { x, y } = pos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
    setIsEmpty(false);
  }

  function end() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  }

  function save() {
    if (isEmpty) return;
    onSave(canvasRef.current.toDataURL("image/png"));
  }

  return (
    <div className="paper p-4 w-full max-w-md">
      <p className="text-sm text-notary-400 mb-2">Draw your signature below</p>
      <canvas
        ref={canvasRef}
        width={420}
        height={160}
        className="w-full border border-dashed border-notary-200 rounded bg-notary-50 touch-none"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="flex items-center justify-between mt-3">
        <button type="button" onClick={clear} className="text-sm text-notary-400 hover:text-notary-700">
          Clear
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="text-sm px-3 py-1.5 rounded border border-notary-200 text-notary-600 hover:bg-notary-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={isEmpty}
            className="text-sm px-3 py-1.5 rounded bg-seal-600 hover:bg-seal-700 text-white disabled:opacity-50"
          >
            Use this signature
          </button>
        </div>
      </div>
    </div>
  );
}
