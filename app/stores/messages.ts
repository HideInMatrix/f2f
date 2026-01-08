import { useLocalStorage } from '@vueuse/core'
import { defineStore, skipHydrate } from 'pinia'


export const useUserMessageStore = defineStore('messages', () => {
    const messages = skipHydrate(useLocalStorage<RoomMessage[]>('messages', []))

    function setMessageToStorage(roomId: string, message: Message) {
        const currentRoomIndex = messages.value.findIndex(item => item.roomId === roomId);
        if (currentRoomIndex === -1) {
            messages.value.push({ roomId: roomId, roomName: '', messages: [message] })
        } else {
            messages.value[currentRoomIndex]?.messages.push(message)
        }
    }

    function getRoomMessages(roomId: string) {
        const roomMessages = messages.value.filter(item => item.roomId === roomId)
        if (roomMessages.length === 0) {
            return []
        } else {
            return roomMessages[0]?.messages
        }
    }

    return {
        setMessageToStorage,
        getRoomMessages
    }
})
