export function getErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const errObj = error as Record<string, unknown>;
    if (typeof errObj.message === "string" && errObj.message) return errObj.message;
    if (typeof errObj.detail === "string" && errObj.detail) return errObj.detail;
    if (Array.isArray(errObj.detail) && errObj.detail.length > 0) {
      const first = errObj.detail[0];
      if (typeof first?.msg === "string") return first.msg;
    }
  }
  return fallback;
}
