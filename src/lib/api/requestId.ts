/**
 * Idempotency keys for mutating requests.
 *
 * Rules:
 * - Every NEW user action gets a NEW id (call `newRequestId()` when the user confirms).
 * - A retry of the SAME action reuses the SAME id — never mint a new one for a retry.
 * - If the outcome is uncertain, do not retry at all: check /api/commands and
 *   /api/positions first (see useAction).
 */
export function newRequestId(): string {
  return `web-${crypto.randomUUID()}`;
}
