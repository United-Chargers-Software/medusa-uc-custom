export const getErrorMessage = (error: any) => {
  const data = error?.response?.data ?? error?.data;
  let msg: string | undefined;
  if (data && typeof data === 'object') {
    msg = data.Message ?? data.message;
    if (Array.isArray(msg) && msg[0]?.message) {
      msg = msg[0].message;
    }
    if (!msg && typeof data.ExceptionMessage === 'string') {
      msg = data.ExceptionMessage;
    }
  }
  if (!msg) {
    msg = 'Something went wrong, Please try again.';
  }
  return msg;
};

/** Returns error message and description from response body for toast notification. */
export const getErrorNotificationText = (error: unknown): string => {
  const err = error as Record<string, unknown> & {
    response?: { status?: number; data?: unknown };
    data?: unknown;
  };
  const raw = err?.response?.data ?? err?.data;

  if (raw !== undefined && raw !== null && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;

    const msg = typeof obj.Message === 'string' ? obj.Message : undefined;
    const exceptionMsg = typeof obj.ExceptionMessage === 'string' ? obj.ExceptionMessage : undefined;
    const exceptionType = typeof obj.ExceptionType === 'string' ? obj.ExceptionType : undefined;
    if (msg !== undefined || exceptionMsg !== undefined || exceptionType !== undefined) {
      const parts: string[] = [];
      if (msg !== undefined) parts.push(msg);
      if (exceptionMsg !== undefined) parts.push(exceptionMsg);
      if (exceptionType !== undefined) parts.push(`(${exceptionType})`);
      return parts.filter(Boolean).join(' ');
    }

    const message = typeof obj.message === 'string' ? obj.message : undefined;
    const description = typeof obj.description === 'string' ? obj.description : undefined;
    if (message !== undefined || description !== undefined) {
      const parts: string[] = [];
      if (message !== undefined) parts.push(`message: ${message}`);
      if (description !== undefined) parts.push(`description: ${description}`);
      return parts.join(', ');
    }
  }

  if (raw !== undefined && raw !== null) {
    if (typeof raw === 'string') {
      return raw;
    }
    if (typeof raw === 'object') {
      try {
        const str = JSON.stringify(raw);
        if (str !== '{}') return str;
      } catch {
        // ignore
      }
    }
  }

  return getErrorMessage(err);
};
