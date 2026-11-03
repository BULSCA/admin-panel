import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    PortalError,
    portalRequest,
    publicData,
    safeColour,
    safeLogo,
} from '@/lib/portalApi';
import { reportPortalError } from '@/lib/portalDiagnostics';
vi.mock('@/lib/portalDiagnostics', () => ({ reportPortalError: vi.fn() }));
const fetcher = vi.fn();
const json = (data: unknown, status = 200, headers = {}) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...headers },
    });
beforeEach(() => {
    vi.stubGlobal('fetch', fetcher);
    fetcher.mockReset();
    vi.clearAllMocks();
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
});
afterEach(() => vi.unstubAllGlobals());
describe('private API requests', () => {
    it('reads without CSRF or caching and uses only same-origin credentials', async () => {
        fetcher.mockResolvedValue(json({ data: { id: 2 } }));
        expect(await portalRequest('/organisations/2')).toEqual({ id: 2 });
        expect(fetcher).toHaveBeenCalledOnce();
        expect(fetcher).toHaveBeenCalledWith(
            '/api/v1/portal/organisations/2',
            expect.objectContaining({
                credentials: 'same-origin',
                cache: 'no-store',
                method: 'GET',
            }),
        );
    });
    it('initialises CSRF and sends a decoded token with a single write', async () => {
        document.cookie = 'XSRF-TOKEN=token%3Dvalue; path=/';
        fetcher
            .mockResolvedValueOnce(new Response(null, { status: 204 }))
            .mockResolvedValueOnce(json({ data: { id: 3 } }));
        await portalRequest('/organisations/2/roles', {
            method: 'POST',
            body: { name: 'Captain', permissions: [] },
        });
        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(fetcher.mock.calls[1][1]).toMatchObject({
            method: 'POST',
            headers: {
                'X-XSRF-TOKEN': 'token=value',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: 'Captain', permissions: [] }),
        });
    });
    it('does not force a content type for multipart logos', async () => {
        document.cookie = 'XSRF-TOKEN=token; path=/';
        fetcher
            .mockResolvedValueOnce(new Response(null, { status: 204 }))
            .mockResolvedValueOnce(json({ data: {} }));
        const body = new FormData();
        body.set('logo', new File(['png'], 'logo.png'));
        await portalRequest('/organisations/2/branding', {
            method: 'POST',
            body,
        });
        expect(fetcher.mock.calls[1][1].headers).not.toHaveProperty(
            'Content-Type',
        );
        expect(fetcher.mock.calls[1][1].body).toBe(body);
    });
    it('stops before writing when the CSRF cookie is missing', async () => {
        fetcher.mockResolvedValue(new Response(null, { status: 204 }));
        await expect(
            portalRequest('/organisations/2/roles', {
                method: 'POST',
                body: {},
            }),
        ).rejects.toMatchObject({ status: 419 });
        expect(fetcher).toHaveBeenCalledOnce();
    });
    it('never retries an uncertain save and reports only a category and route', async () => {
        document.cookie = 'XSRF-TOKEN=token; path=/';
        fetcher
            .mockResolvedValueOnce(new Response(null, { status: 204 }))
            .mockRejectedValueOnce(Error('private-email@example.test'));
        await expect(
            portalRequest('/organisations/2/members', {
                method: 'POST',
                body: { email: 'private-email@example.test' },
            }),
        ).rejects.toThrow('could not confirm');
        expect(fetcher).toHaveBeenCalledTimes(2);
        expect(reportPortalError).toHaveBeenCalledWith(
            'network',
            '/organisations/2/members',
        );
    });
    it.each([401, 419])(
        'announces an expired session for %s without exposing the body',
        async (status) => {
            const listener = vi.fn();
            window.addEventListener('portal-session-expired', listener);
            fetcher.mockResolvedValue(
                json({ message: 'private provider text' }, status),
            );
            await expect(portalRequest('/me')).rejects.toThrow('sign in again');
            expect(listener).toHaveBeenCalledOnce();
            expect(reportPortalError).not.toHaveBeenCalled();
            window.removeEventListener('portal-session-expired', listener);
        },
    );
    it('normalises malformed field errors and ignores unsafe correlation IDs', async () => {
        fetcher.mockResolvedValue(
            json(
                {
                    errors: {
                        name: ['A name is required'],
                        email: 'not an array',
                        bad: [null],
                    },
                },
                422,
                { 'X-Request-ID': 'unsafe-user-name' },
            ),
        );
        await expect(portalRequest('/organisations/2')).rejects.toMatchObject({
            status: 422,
            fields: { name: ['A name is required'] },
            requestId: undefined,
        });
    });
    it('uses safe server messages and carries the server reference', async () => {
        const requestId = '6a827db4-bd31-4657-9550-9d66cce493ba';
        fetcher.mockResolvedValue(
            json({ message: 'SQL password secret' }, 500, {
                'X-Request-ID': requestId,
            }),
        );
        await expect(portalRequest('/me')).rejects.toMatchObject({
            status: 500,
            requestId,
            message: expect.not.stringContaining('secret'),
        });
        expect(reportPortalError).toHaveBeenCalledWith(
            'server',
            '/me',
            500,
            requestId,
        );
    });
    it('turns successful HTML or a missing envelope into a recoverable error', async () => {
        fetcher.mockResolvedValue(new Response('<html>proxy error</html>'));
        await expect(portalRequest('/me')).rejects.toBeInstanceOf(PortalError);
        expect(reportPortalError).toHaveBeenCalledWith(
            'invalid_response',
            '/me',
        );
    });
    it('does not report a deliberately cancelled read', async () => {
        const controller = new AbortController();
        controller.abort();
        fetcher.mockRejectedValue(new DOMException('Aborted', 'AbortError'));
        await expect(
            portalRequest('/me', { signal: controller.signal }),
        ).rejects.toThrow('Aborted');
        expect(reportPortalError).not.toHaveBeenCalled();
    });
    it('fetches public dashboard sections without credentials', async () => {
        fetcher.mockResolvedValue(json({ data: [] }));
        expect(await publicData('homepage/highlights')).toEqual([]);
        expect(fetcher).toHaveBeenCalledWith(
            '/api/v1/homepage/highlights',
            expect.objectContaining({ credentials: 'omit' }),
        );
    });
    it('validates branding values before using them in the DOM', () => {
        expect(safeColour('red;background:url(bad)')).toBe('#B1040B');
        expect(safeColour('#123abc')).toBe('#123abc');
        expect(safeLogo('javascript:alert(1)')).toBeNull();
        expect(safeLogo('//evil.example/logo.png')).toBeNull();
        expect(safeLogo('/\\evil.example/logo.png')).toBeNull();
        expect(safeLogo('/storage/logo.png')).toBe('/storage/logo.png');
    });
});
