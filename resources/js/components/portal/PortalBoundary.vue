<script setup lang="ts">
import { onErrorCaptured, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import PortalNotice from '@/components/portal/PortalNotice.vue';
import { reportPortalError } from '@/lib/portalDiagnostics';

const route = useRoute();
const failed = ref(false);
const revision = ref(0);
onErrorCaptured(() => {
    failed.value = true;
    reportPortalError('component', route.path);

    return false;
});
watch(
    () => route.path,
    () => {
        failed.value = false;
    },
);
function retry() {
    revision.value++;
    failed.value = false;
}
</script>
<template>
    <PortalNotice
        v-if="failed"
        message="This section could not be displayed. You can try loading it again or open another portal page."
        :retry="retry"
    />
    <div v-else :key="revision"><slot /></div>
</template>
