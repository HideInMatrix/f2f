import { useLocalStorage } from '@vueuse/core'
import { defineStore, skipHydrate } from 'pinia'


export const useUserRoomsStore = defineStore('rooms', () => {
    const rooms = skipHydrate(useLocalStorage<ClientRoomInfo[]>('rooms', []))

    function createNewRoom(roomInfo: ClientRoomInfo) {
        rooms.value.push(roomInfo)
    }

    return {
        rooms,
        createNewRoom
    }
})
