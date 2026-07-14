const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("docsign_token");
}

class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

async function request(path, { method = "GET", body, auth = true, isForm = false } = {}) {
  const headers = {};
  if (!isForm) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    /* no JSON body, e.g. a file response handled elsewhere */
  }

  if (!res.ok) {
    const detail = data?.detail || res.statusText;
    throw new ApiError(typeof detail === "string" ? detail : JSON.stringify(detail), res.status, detail);
  }
  return data;
}

export const api = {
  // --- Auth ---
  register: (payload) => request("/api/auth/register", { method: "POST", body: payload, auth: false }),
  login: (email, password) => {
    const form = new URLSearchParams();
    form.set("username", email);
    form.set("password", password);
    return request("/api/auth/login", { method: "POST", body: form, auth: false, isForm: true });
  },
  me: () => request("/api/auth/me"),

  // --- Documents ---
  listDocuments: () => request("/api/docs"),
  uploadDocument: (file) => {
    const form = new FormData();
    form.append("file", file);
    return request("/api/docs/upload", { method: "POST", body: form, isForm: true });
  },
  getDocument: (id) => request(`/api/docs/${id}`),
  finalizeDocument: (id) => request(`/api/docs/${id}/finalize`, { method: "POST" }),
  deleteDocument: (id) => request(`/api/docs/${id}`, { method: "DELETE" }),
  originalFileUrl: (id) => `${API_BASE}/api/docs/${id}/download`,
  signedFileUrl: (id) => `${API_BASE}/api/docs/${id}/download-signed`,

  // --- Signatures (authenticated owner) ---
  listSignatures: (docId) => request(`/api/signatures/${docId}`),
  addSignature: (payload) => request("/api/signatures", { method: "POST", body: payload }),
  deleteSignatureField: (fieldId) => request(`/api/signatures/field/${fieldId}`, { method: "DELETE" }),

  // --- Public signing link (no auth) ---
  publicGetDocument: (token) => request(`/api/public/sign/${token}`, { auth: false }),
  publicFileUrl: (token) => `${API_BASE}/api/public/sign/${token}/file`,
  publicAddSignature: (token, payload) =>
    request(`/api/public/sign/${token}`, { method: "POST", body: payload, auth: false }),

  // --- Audit ---
  getAuditTrail: (docId) => request(`/api/audit/${docId}`),

  // Original/signed downloads require the Authorization header, which a
  // plain <a href> can't send — so fetch as a blob and trigger the save
  // ourselves instead of linking directly to the URL.
  downloadFile: async (url, filename) => {
    const token = getToken();
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new ApiError("Download failed", res.status);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  },
};

export { ApiError, API_BASE };
