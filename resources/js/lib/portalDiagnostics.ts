// Fixed categories and route templates only: never send exception text, names, queries or form values.
type Category =
    | 'network'
    | 'server'
    | 'invalid_response'
    | 'component'
    | 'route'
    | 'unhandled';
const reported = new Set<string>();
export function reportPortalError(
    category: Category,
    path: string,
    status?: number,
    requestId?: string,
) {
    const route = path.startsWith('/organisations')
        ? '/organisations/{organisation}'
        : ['/me', '/presentation', '/homepage/highlights'].includes(path)
          ? path
          : '/';
    const key = `${category}:${route}:${status || 0}`;

    if (reported.has(key) || reported.size >= 10) {
        return;
    }

    reported.add(key);
    const uuid = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

    try {
        void fetch('/api/v1/client-errors', {
            method: 'POST',
            credentials: 'omit',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            signal: AbortSignal.timeout(5000),
            body: JSON.stringify({
                app: 'portal',
                app_version: 'organisation-portal-v1',
                event_id: crypto.randomUUID(),
                category,
                message:
                    category === 'component'
                        ? 'Unexpected interface error'
                        : 'Request failed',
                route_template: route,
                ...(status && status >= 400 && status <= 599 ? { status } : {}),
                ...(requestId && uuid.test(requestId)
                    ? { request_id: requestId }
                    : {}),
            }),
        }).catch(() => {});
    } catch {
        /* Reporting must not interrupt the interface. */
    }
}
