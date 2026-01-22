<script lang="ts" setup>
import Chat from "~/components/Chat.vue";
import Splitter from "~/components/Splitter.vue";
import UserList from "~/components/UserList.vue";
import { useRoute } from "#imports";
import { useRoomList } from "~/composables/useRoomList";
import { useUserStore } from "#imports";

const route = useRoute();
const roomId = route.params.id as string;

const { rooms } = useRoomList();
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const roomInfo = computed(() => rooms.value.find((r) => r.roomInfo.roomId === roomId));
</script>

<template>
  <NuxtLayout>
    <ClientOnly>
      <div class="h-screen">
        <Splitter>
          <template #left>
            <div class="bg-white">
              <div class="p-4 border-b">
                <div class="text-lg font-medium">房间成员</div>
                <div class="text-sm text-gray-500">
                  我的身份：<span :class="roomInfo?.owner.userId === user.userId ? 'text-blue-600 font-semibold' : ''">{{ roomInfo?.owner.userId === user.userId ? "房主" : "成员" }}</span>
                </div>
              </div>
              <UserList :room="roomInfo" />
            </div>
          </template>

          <template #right>
            <Chat />
          </template>
        </Splitter>
      </div>
    </ClientOnly>
  </NuxtLayout>
</template>
