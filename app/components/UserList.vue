<template>
  <div class="p-4 h-full flex flex-col">
    <div class="mb-3">
      <ElInput v-model="filter" placeholder="搜索用户" clearable />
    </div>

    <div class="flex-1 overflow-auto">
      <ElScrollbar style="height: 100%">
        <div v-if="!users || users.length === 0" class="text-sm text-gray-500">房间内暂无用户</div>
        <ElCard v-for="(u, i) in filteredUsers" :key="i" class="mb-2">
          <div class="flex items-center gap-3">
            <ElAvatar :text="u.name?.slice(0, 1)" />
            <div class="flex-1">
              <div class="font-medium">{{ u.name || "unknown" }}</div>
              <div class="text-xs text-gray-500">{{ isOwner(u) ? "房主" : "成员" }}</div>
            </div>
            <div class="flex flex-col items-end gap-1">
              <div :title="webrtcStatus(u)" class="flex items-center gap-2">
                <span :class="['w-3 h-3 rounded-full border', webrtcDotClass(u)]"></span>
                <small class="text-xs text-gray-500">RTC</small>
              </div>
            </div>
          </div>
        </ElCard>
      </ElScrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = defineProps<{ room?: ClientRoomInfo | undefined }>();

const filter = ref("");

const users = computed(() => props.room?.users || []);

const filteredUsers = computed(() => {
  if (!filter.value) return users.value;
  return users.value.filter((u: any) => (u.name || "").toLowerCase().includes(filter.value.toLowerCase()));
});

function isOwner(u: any) {
  return props.room?.owner?.userId === u.userId;
}

function webrtcStatus(u: any) {
  // If peer provides explicit webrtc state, prefer it. Else use generic status.
  return (u.webrtcStatus || u.connectionState || u.status || "idle").toString();
}

function webrtcDotClass(u: any) {
  const s = webrtcStatus(u).toLowerCase();
  switch (s) {
    case "connected":
    case "connected":
      return "bg-green-500";
    case "connecting":
      return "bg-yellow-400";
    case "checking":
      return "bg-blue-500";
    case "failed":
      return "bg-red-500";
    case "idle":
      return "bg-gray-300";
    default:
      return "bg-gray-300";
  }
}
</script>

<style scoped>
.mb-2 {
  margin-bottom: 0.5rem;
}
</style>
