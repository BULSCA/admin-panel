import { describe, expect, it } from 'vitest';
import { useDateTime } from '@/composables/useDateTime';

describe('notification date display', () => {
    it('uses London time across the daylight-saving boundary', () => {
        const { formatDateTime } = useDateTime();
        expect(formatDateTime('2026-07-01T23:30:00Z')).toContain('2 Jul 2026');
        expect(formatDateTime('2026-07-01T23:30:00Z')).toContain('00:30');
    });

    it('keeps notification rendering usable with missing or invalid dates', () => {
        const { formatDateTime } = useDateTime();

        for (const value of [null, undefined, '', 'invalid']) {
            expect(formatDateTime(value)).toBe('Date unavailable');
        }
    });
});
