<script setup lang="ts">
import AppLayout from '@/layouts/AppLayout.vue';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/vue3';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardCard from '@/components/common/DashboardCard.vue';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import EmptyState from '@/components/common/EmptyState.vue';
import DashboardContainer from '@/components/common/DashboardContainer.vue';
import { Bell, CheckCircle2, FileText, Users, Calendar } from 'lucide-vue-next';
import { useDateTime } from '@/composables/useDateTime';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

const props = defineProps<{
  notifications: {
    data: Notification[];
    total: number;
  };
  unreadCount: number;
}>();

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notifications',
        href: '/notifications',
    },
];

const { formatDateTime } = useDateTime();

function markAsRead(notification: Notification) {
  if (!notification.read) {
    router.post(`/notifications/${notification.id}/read`, {}, {
      preserveScroll: true,
    });
  }
  
  // Navigate to link if available
  if (notification.data?.link) {
    router.visit(notification.data.link);
  }
}

function markAllAsRead() {
  router.post('/notifications/mark-all-read');
}

function getIcon(type: string) {
  const icons = {
    new_submission: Users,
    form_published: FileText,
    collaboration_invite: Users,
  };
  return icons[type as keyof typeof icons] || Bell;
}
</script>

<template>
  <Head title="Notifications" />

  <AppLayout :breadcrumbs="breadcrumbs">
    <div class="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">Notifications</h1>
          <p class="text-sm text-muted-foreground mt-1">
            {{ unreadCount }} unread notification{{ unreadCount !== 1 ? 's' : '' }}
          </p>
        </div>
        <Button 
          v-if="unreadCount > 0"
          @click="markAllAsRead"
          variant="outline"
          class="gap-2"
        >
          <CheckCircle2 :size="18" />
          Mark All as Read
        </Button>
      </div>

      <!-- Notifications List -->
      <DashboardContainer>
        <!-- Empty State -->
        <EmptyState
          v-if="notifications.data.length === 0"
          :icon="Bell"
          title="No notifications"
          description="You're all caught up!"
        />

        <!-- Notifications -->
        <div v-else class="space-y-3">
          <DashboardCard
            v-for="notification in notifications.data"
            :key="notification.id"
            hover
            clickable
            :class="!notification.read && 'border-primary/50 bg-primary/5'"
            @click="markAsRead(notification)"
          >
            <CardHeader class="pb-3">
              <div class="flex items-start justify-between">
                <div class="flex items-start gap-3 flex-1">
                  <div 
                    :class="[
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      notification.read ? 'bg-muted' : 'bg-primary/10'
                    ]"
                  >
                    <component 
                      :is="getIcon(notification.type)" 
                      :size="18" 
                      :class="notification.read ? 'text-muted-foreground' : 'text-primary'"
                    />
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <CardTitle class="text-base">
                        {{ notification.title }}
                      </CardTitle>
                      <Badge v-if="!notification.read" variant="default" class="text-xs">
                        New
                      </Badge>
                    </div>
                    <CardDescription class="text-sm mb-2">
                      {{ notification.message }}
                    </CardDescription>
                    <div class="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar :size="12" />
                      {{ formatDateTime(notification.created_at) }}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </DashboardCard>
        </div>
      </DashboardContainer>
    </div>
  </AppLayout>
</template>