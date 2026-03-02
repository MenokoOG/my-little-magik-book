type Entry = {
    count: number;
    resetAt: number;
};

const buckets = new Map<string, Entry>();

export function checkRateLimit(key: string, max: number, windowMs: number) {
    const now = Date.now();
    const current = buckets.get(key);

    if (!current || now > current.resetAt) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { ok: true, remaining: max - 1 };
    }

    if (current.count >= max) {
        return { ok: false, remaining: 0, retryAfterMs: current.resetAt - now };
    }

    current.count += 1;
    return { ok: true, remaining: max - current.count };
}

export function getClientKey(request: Request) {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const realIp = request.headers.get("x-real-ip")?.trim();
    return forwarded || realIp || "unknown";
}
