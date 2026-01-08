<template>
  <NuxtLayout>
    <div class="p-6 max-w-xl mx-auto space-y-4">
      <h1 class="text-2xl font-bold">聊天室</h1>

      <div class="flex gap-2">
        <input v-model="user.name" placeholder="用户名" class="border p-2 flex-1 rounded" />
        <button class="bg-blue-500 text-white px-4 rounded" @click="handleCreateUser">创建用户</button>
      </div>

      <div class="flex gap-2">
        <input v-model="newRoom" placeholder="房间名" class="border p-2 flex-1 rounded" />
        <button class="bg-blue-500 text-white px-4 rounded" @click="handleCreateRoom">创建房间</button>
      </div>

      <h2 class="font-semibold">已有房间</h2>

      <ul class="space-y-2">
        <li v-for="r in rooms" :key="r.roomInfo.roomId" class="flex justify-between items-center border p-2 rounded">
          <span>{{ r.roomInfo.roomName }}（{{ r.count }} 人）</span>
          <button class="text-sm bg-green-500 text-white px-3 py-1 rounded" @click="join(r.roomInfo)">加入</button>
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

const handleCreateUser = () => {
  if (user.value.name === "") {
    alert("请输入用户名");
    return;
  }
  user.value.userId = user.value.userId !== "" ? user.value.userId : uuidV4();
};

const handleCreateRoom = () => {
  if (newRoom.value === "") {
    alert("请输入房间名称");
    return;
  }
  if (user.value.userId === "") {
    alert("请先创建用户");
    return;
  }
  const roomId = uuidV4();
  createRoom({ roomId, roomName: newRoom.value }, user.value);
};

function join(roomInfo: ClientBaseRoomInfo) {
  if (!user.value.name) return;
  router.push(`/room/${roomInfo.roomId}`);
}
</script>
