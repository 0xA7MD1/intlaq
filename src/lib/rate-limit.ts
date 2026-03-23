export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

export type RateLimitState = {
  count: number;
  resetAt: number;
};

export function consumeFixedWindow(args: {
  store: Map<string, RateLimitState>;
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
}): RateLimitResult {
  const now = args.now ?? Date.now();

  let state = args.store.get(args.key);
  if (!state || now >= state.resetAt) {
    state = { count: 0, resetAt: now + args.windowMs };
  }

  state.count += 1;
  args.store.set(args.key, state);

  const remaining = Math.max(0, args.limit - state.count);
  const allowed = state.count <= args.limit;
  const retryAfterSeconds = allowed ? 0 : Math.max(1, Math.ceil((state.resetAt - now) / 1000));

  return {
    allowed,
    limit: args.limit,
    remaining,
    resetAt: state.resetAt,
    retryAfterSeconds,
  };
}

