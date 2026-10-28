const dateTime = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/London',
});

export function useDateTime() {
    function formatDateTime(value: string | null | undefined): string {
        if (!value) {
            return 'Date unavailable';
        }

        const date = new Date(value);

        return Number.isFinite(date.getTime())
            ? dateTime.format(date)
            : 'Date unavailable';
    }

    return { formatDateTime };
}
