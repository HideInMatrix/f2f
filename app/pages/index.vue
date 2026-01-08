<template>
  <NuxtLayout>
    <div class="p-6 max-w-xl mx-auto space-y-4">
      <h1 class="text-2xl font-bold">聊天室</h1>

      <input v-model="user.name" placeholder="用户名" class="border p-2 w-full rounded" />

      <div class="flex gap-2">
        <input v-model="newRoom" placeholder="房间名" class="border p-2 flex-1 rounded" />
        <button class="bg-blue-500 text-white px-4 rounded" @click="handleCreate">创建</button>
      </div>

      <h2 class="font-semibold">已有房间</h2>

      <ul class="space-y-2">
        <li v-for="r in rooms" :key="r.room" class="flex justify-between items-center border p-2 rounded">
          <span>{{ r.room }}（{{ r.count }} 人）</span>
          <button class="text-sm bg-green-500 text-white px-3 py-1 rounded" @click="join(r.room)">加入</button>
        </li>
      </ul>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "#imports";
import { useWsClient } from "~/composables/useWsClient";
import { useUserStore } from "#imports";
import { v4 as uuidV4 } from "uuid";

const userStore = useUserStore();
const { rooms, createRoom } = useRoomList();

const router = useRouter();
const { user } = storeToRefs(userStore);

const newRoom = ref("");

const { send, onMessage } = useWsClient();

onMounted(() => {
  onMessage((data) => {
    if (data.type === "rooms") {
      rooms.value = data.rooms;
    }
  });

  send({ type: "list" });
});

const handleCreate = () => {
  user.value.userId = user.value.userId !== "" ? user.value.userId : uuidV4();
  createRoom(newRoom.value, user.value);
};

function join(room: string) {
  if (!user.value.name) return;
  router.push(`/room/${room}`);
}
</script>
