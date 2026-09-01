// type of error JSON response from backend 
export type ApiErrorResponse = {
  timestamp?: string;
  status: number;
  error: string;
  message: string;
  path?: string;
  errors?: Record<string, string>; // field -> message
};

export class ApiHttpError extends Error {
  status: number;
  errors?: Record<string, string>;
  constructor(payload: ApiErrorResponse) {
    super(payload.message || "Request failed");
    this.name = "ApiHttpError";
    this.status = payload.status;
    this.errors = payload.errors;
  }
}

// This prevents from crashing if the backend doesn’t return JSON.
export async function parseOrFallback(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}