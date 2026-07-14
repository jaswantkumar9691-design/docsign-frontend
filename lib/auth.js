export function setToken(token) {
  localStorage.setItem("docsign_token", token);
}

export function clearToken() {
  localStorage.removeItem("docsign_token");
}

export function isLoggedIn() {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("docsign_token");
}
