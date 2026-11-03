import { reportPortalError } from '@/lib/portalDiagnostics';

// Keep authentication same-origin. Do not send sessions or CSRF tokens to arbitrary origins.
const configured = String(
    import.meta.env.VITE_PORTAL_API_URL || '/api/v1/portal',
).replace(/\/$/, '');
const base = /^\/(?!\/)[a-zA-Z0-9/_-]+$/.test(configured)
    ? configured
    : '/api/v1/portal';
const uuid = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export class PortalError extends Error {
    constructor(
        public status: number,
        message: string,
        public fields: Record<string, string[]> = {},
        public requestId?: string,
    ) {
        super(message);
    }
}
function fields(value: unknown): Record<string, string[]> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(value)
            .filter(
                ([, messages]) =>
                    Array.isArray(messages) &&
                    messages.every((message) => typeof message === 'string'),
            )
            .slice(0, 30),
    );
}
export async function portalRequest<T>(
    path: string,
    options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
    const method = options.method || 'GET';
    const headers: Record<string, string> = { Accept: 'application/json' };
    let response: Response;

    try {
        if (method !== 'GET') {
            const csrf = await fetch(base + '/csrf', {
                credentials: 'same-origin',
                cache: 'no-store',
                signal: AbortSignal.timeout(10000),
            });

            if (!csrf.ok) {
                throw new PortalError(
                    csrf.status,
                    'Secure form setup failed. Refresh the page and try again.',
                );
            }

            const cookie = document.cookie
                .split('; ')
                .find((value) => value.startsWith('XSRF-TOKEN='));

            if (!cookie) {
                throw new PortalError(
                    419,
                    'Cookies are required to save securely. Sign in again.',
                );
            }

            headers['X-XSRF-TOKEN'] = decodeURIComponent(
                cookie.slice('XSRF-TOKEN='.length),
            );
        }

        const multipart = options.body instanceof FormData;

        if (options.body !== undefined && !multipart) {
            headers['Content-Type'] = 'application/json';
        }

        response = await fetch(base + path, {
            method,
            headers,
            credentials: 'same-origin',
            cache: 'no-store',
            body:
                options.body === undefined
                    ? undefined
                    : multipart
                      ? (options.body as FormData)
                      : JSON.stringify(options.body),
            signal: options.signal
                ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
                : AbortSignal.timeout(15000),
        });
    } catch (error) {
        if (options.signal?.aborted || error instanceof PortalError) {
            throw error;
        }

        reportPortalError('network', path);

        throw new PortalError(
            0,
            method === 'GET'
                ? 'This section is unavailable. You can try loading it again.'
                : 'We could not confirm the save. Your input is still here. Refresh the record before trying again.',
        );
    }

    const body = await response.json().catch(() => null);
    const id = response.headers.get('X-Request-ID') || '';
    const requestId = uuid.test(id) ? id : undefined;

    if (!response.ok) {
        if ([401, 419].includes(response.status)) {
            window.dispatchEvent(new Event('portal-session-expired'));
        }

        if (response.status >= 500) {
            reportPortalError('server', path, response.status, requestId);
        }

        const messages: Record<number, string> = {
            401: 'Your session has ended. Please sign in again.',
            419: 'Your session has ended. Please sign in again.',
            403: 'You do not have permission to make this change.',
            404: 'This organisation or record is unavailable to your account.',
            413: 'This file is too large. Choose a logo up to 2 MB.',
            422: 'Check the fields listed below.',
            429: 'Too many requests. Please wait before trying again.',
        };

        throw new PortalError(
            response.status,
            messages[response.status] ||
                'The service could not complete this request. Your input has been kept.',
            fields(body?.errors),
            requestId,
        );
    }

    if (!body || typeof body !== 'object' || !('data' in body)) {
        return invalidResponse(path);
    }

    return body.data as T;
}
export function invalidResponse(path = '/'): never {
    reportPortalError('invalid_response', path);

    throw new PortalError(
        502,
        'The service returned an unexpected response. Please try loading this section again.',
    );
}
export function safeLogo(value: unknown): string | null {
    return typeof value === 'string' &&
        !/[\x00-\x20\x7f\\]/.test(value) &&
        (/^https?:\/\//.test(value) || /^\/(?!\/)/.test(value))
        ? value
        : null;
}
export function safeColour(value: unknown, fallback = '#B1040B'): string {
    return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
        ? value
        : fallback;
}
export async function publicData<T>(
    path: string,
    signal?: AbortSignal,
): Promise<T> {
    try {
        const response = await fetch(`/api/v1/${path}`, {
            credentials: 'omit',
            signal: signal
                ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
                : AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            if (response.status >= 500) {
                reportPortalError('server', '/' + path, response.status);
            }

            throw new PortalError(
                response.status,
                'This section is temporarily unavailable.',
            );
        }

        const json = await response.json();

        if (!json || typeof json !== 'object' || !('data' in json)) {
            return invalidResponse('/' + path);
        }

        return json.data as T;
    } catch (error) {
        if (signal?.aborted) {
            throw error;
        }

        if (!(error instanceof PortalError)) {
            reportPortalError('network', '/' + path);
        }

        throw error instanceof PortalError
            ? error
            : new PortalError(502, 'This section is temporarily unavailable.');
    }
}
