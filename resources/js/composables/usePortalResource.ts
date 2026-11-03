import { onScopeDispose, ref, watch } from 'vue';
import { PortalError, portalRequest } from '@/lib/portalApi';

export function usePortalResource<T>(
    path: () => string,
    loader: (path: string, signal: AbortSignal) => Promise<unknown> = (
        url,
        signal,
    ) => portalRequest<unknown>(url, { signal }),
    validate: (value: unknown) => T = (value) => value as T,
) {
    const data = ref<T | null>(null);
    const loading = ref(false);
    const error = ref<PortalError | null>(null);
    let controller: AbortController | undefined;
    let version = 0;
    async function reload() {
        const current = ++version;
        controller?.abort();
        controller = new AbortController();
        data.value = null;
        error.value = null;
        loading.value = true;

        try {
            const result = validate(await loader(path(), controller.signal));

            if (current === version) {
                data.value = result;
            }
        } catch (failure) {
            if (current === version && !controller.signal.aborted) {
                error.value =
                    failure instanceof PortalError
                        ? failure
                        : new PortalError(
                              502,
                              'This section could not be loaded. Please try again.',
                          );
            }
        } finally {
            if (current === version) {
                loading.value = false;
            }
        }
    }
    watch(
        path,
        () => {
            void reload();
        },
        { immediate: true },
    );
    onScopeDispose(() => {
        version++;
        controller?.abort();
    });

    return { data, error, loading, reload };
}
