import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const fetcher = vi.fn();
beforeEach(() => {
    vi.resetModules();
    fetcher.mockReset().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetcher);
});
afterEach(() => vi.unstubAllGlobals());
it('reports bounded, anonymous diagnostics using fixed route templates and deduplicates errors', async () => {
    const { reportPortalError } = await import('@/lib/portalDiagnostics');
    reportPortalError(
        'network',
        '/organisations/555/members?q=private-email@example.test',
    );
    reportPortalError(
        'network',
        '/organisations/666/members?q=another-email@example.test',
    );
    expect(fetcher).toHaveBeenCalledOnce();
    const [, options] = fetcher.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(options.credentials).toBe('omit');
    expect(body.route_template).toBe('/organisations/{organisation}');
    expect(Object.keys(body).sort()).toEqual(
        [
            'app',
            'app_version',
            'event_id',
            'category',
            'message',
            'route_template',
        ].sort(),
    );
    expect(options.body).not.toContain('private-email');
    expect(options.body).not.toContain('/organisations/555');
});
it('does not turn a failed diagnostic request into another failure report', async () => {
    fetcher.mockRejectedValue(Error('Unavailable'));
    const { reportPortalError } = await import('@/lib/portalDiagnostics');
    expect(() =>
        reportPortalError('component', '/anything/private'),
    ).not.toThrow();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetcher).toHaveBeenCalledOnce();
});
