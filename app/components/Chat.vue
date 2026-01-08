<template>
  <div class="h-screen flex flex-col p-6 max-w-2xl mx-auto">
    <!-- 头部 -->
    <div class="mb-4">
      <h2 class="text-xl font-bold">房间：{{ roomId }}</h2>
      <p class="text-sm text-gray-500">
        我的身份：
        <span :class="isOwner ? 'text-blue-600 font-semibold' : ''">
          {{ isOwner ? "房主" : "成员" }}
        </span>
      </p>
    </div>

    <!-- 消息区域 -->
    <div ref="msgBox" class="flex-1 border rounded p-3 overflow-y-auto space-y-1 bg-gray-50">
      <div v-for="(m, i) in messages" :key="i" class="text-sm">
        <span class="font-medium">{{ m.name }}：</span>
        <span>{{ m.message }}</span>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="mt-3 flex gap-2">
      <input v-model="input" class="flex-1 border rounded p-2" placeholder="输入消息" @keydown.enter="sendMsg" />
      <button class="px-4 py-2 rounded bg-blue-500 text-white disabled:opacity-50" :disabled="!canSend" @click="sendMsg">
        {{ connectionState === "checking" ? "检查中" : connectionState === "connecting" ? "连接中" : connectionState === "connected" ? "发送" : "连接失败" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRoute } from "#imports";
import { useWsClient } from "~/composables/useWsClient";
import { useRoomList } from "~/composables/useRoomList";
import { useChat } from "~/composables/useChat";
import { useUserStore } from "#imports";

/* ========================
   基础信息
======================== */

const route = useRoute();
const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const roomId = route.params.id as string;

const input = ref("");

/* ========================
   房间信息（用于判断房主）
======================== */

const { rooms } = useRoomList();

const roomInfo = computed(() => rooms.value.find((r) => r.room === roomId));

const isOwner = computed(() => {
  console.log("房间信息", roomInfo.value);

  return roomInfo.value?.owner.userId === user.value.userId;
});

/* ========================
  WebSocket：加入房间
======================== */

const { send, onMessage } = useWsClient();

/* ==================
  在监听到用户加入房间的时候发送自己的ICE信息
=====================*/
onMessage(async (data) => {
  console.log("信令", data);

  if (data.type === "rooms" && isOwner.value) {
    const newRoomInfo = data.rooms.find((r: any) => r.room === roomId);
    if (newRoomInfo.users && newRoomInfo.users.length > 1) {
      start();
    }
  }
});

/* ========================
   WebRTC Chat
======================== */

const { messages, start, sendMessage, connectionState } = useChat(roomId, user.value);

/* ========================
   生命周期
======================== */

onMounted(() => {
  // 通知服务器加入房间（信令）
  console.log("我加入了房间");

  send({
    type: "join-room",
    room: roomId,
    user: user.value,
  });
});

// 通知服务器离开房间 (信令)
onBeforeRouteLeave((leaveGuard) => {
  send({
    type: "leave-room",
    room: roomId,
    user: user.value,
  });
});

/* ========================
   发送消息
======================== */

const canSend = computed(() => connectionState.value === "connected" && input.value.trim().length > 0);

function sendMsg() {
  if (!canSend.value) return;
  sendMessage(input.value.trim());
  input.value = "";
}

/* ========================
   自动滚动到底部
======================== */

const msgBox = ref<HTMLElement>();

watch(
  messages,
  async () => {
    await nextTick();
    msgBox.value?.scrollTo({
      top: msgBox.value.scrollHeight,
      behavior: "smooth",
    });
  },
  { deep: true }
);
</script>
