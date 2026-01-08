
type ClientBaseRoomInfo = {
    roomId: string;
    roomName: string
}

type ClientRoomInfo = { roomInfo: ClientBaseRoomInfo, count: number; owner: User; users?: User[] }

interface PeerContext {
    roomInfo?: ClientBaseRoomInfo
    user?: User
}
type User = { name: string, userId: string }
type WSMessageType = "rooms" | 'signal' | 'system' | 'list' | 'create-room' | 'join-room'
type ClientMessage =
    | { type: 'list' }
    | { type: 'create-room'; owner: User, roomInfo: ClientBaseRoomInfo }
    | { type: 'join-room'; roomId: string; user: User }
    | { type: 'signal'; roomId: string; data: any }
    | { type: 'leave-room'; roomId: string; data: any }

type ServerMessage =
    | {
        type: WSMessageType
        rooms: ClientRoomInfo[]
    }
    | { type: 'signal'; data: any }
    | { type: 'system'; message: string }