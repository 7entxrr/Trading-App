/** Normalised error for every GoldMiner call made through the app's proxy. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    /** True when a mutating request may or may not have been executed. */
    public uncertain = false,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: "Invalid request",
  401: "Authentication failed",
  403: "Permission denied",
  404: "Resource not found",
  409: "Request conflict / duplicate / state conflict",
  422: "Invalid request",
  429: "Too many requests — please wait a moment",
  500: "Server unavailable",
  501: "Feature not implemented",
  502: "Server unavailable",
  503: "Server unavailable",
  504: "Server did not respond in time",
};

/** Pulls a human-readable message out of common FastAPI / proxy error shapes. */
function backendMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const b = body as Record<string, unknown>;
  const err = b.error as Record<string, unknown> | undefined;
  if (err && typeof err.message === "string") return err.message;
  if (typeof b.detail === "string") return b.detail;
  // FastAPI 422: detail is a list of { loc, msg }
  if (Array.isArray(b.detail)) {
    const msgs = b.detail
      .map((d) => (d && typeof d === "object" && typeof (d as { msg?: unknown }).msg === "string" ? (d as { msg: string }).msg : null))
      .filter(Boolean);
    if (msgs.length) return msgs.join("; ");
  }
  if (typeof b.message === "string") return b.message;
  return undefined;
}

export function toApiError(status: number, body: unknown): ApiError {
  const b = (body ?? {}) as { error?: { code?: string; uncertain?: boolean } };
  const code = b.error?.code ?? `HTTP_${status}`;
  const generic = STATUS_MESSAGES[status] ?? (status >= 500 ? "Server unavailable" : "Request failed");
  // Show the backend's own message when it gives one (never a stack trace: we only take strings from known fields).
  const detail = backendMessage(body);
  const message = detail && detail.length < 300 ? `${generic}: ${detail}` : generic;
  return new ApiError(status, code, message, !!b.error?.uncertain);
}

export function networkError(mutating: boolean): ApiError {
  return mutating
    ? new ApiError(0, "OUTCOME_UNKNOWN", "Connection lost before the server confirmed. Checking what happened…", true)
    : new ApiError(0, "NETWORK", "Unable to connect to trading server");
}
