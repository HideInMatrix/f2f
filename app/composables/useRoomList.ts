import { ref, onMounted } from 'vue'
import { useWsClient } from './useWsClient'

export function useRoomList() {
    const rooms = ref<
        ClientRoomInfo[]
    >([])

    const { send, onMessage } = useWsClient()

    onMounted(() => {
        onMessage((data) => {
            if (data.type === 'rooms') {
                rooms.value = data.rooms
            }
        })

        send({ type: 'list' })
    })

    function createRoom(room: string, owner: User) {
        send({
            type: 'create-room',
            room,
            owner
        })
    }

    return {
        rooms,
        createRoom
    }
}