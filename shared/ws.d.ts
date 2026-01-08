
type ClientRoomInfo = { room: string; count: number; owner: User; users?: User[] }

interface PeerContext {
    room?: string
    user?: User
}
type User = { name: string, userId: string }
type WSMessageType = "rooms" | 'signal' | 'system' | 'list' | 'create-room' | 'join-room'
type ClientMessage =
    | { type: 'list' }
    | { type: 'create-room'; room: string; owner: User }
    | { type: 'join-room'; room: string; user: User }
    | { type: 'signal'; room: string; data: any }
    | { type: 'leave-room'; room: string; data: any }

type ServerMessage =
    | {
        type: WSMessageType
        rooms: ClientRoomInfo[]
    }
    | { type: 'signal'; data: any }
    | { type: 'system'; message: string }