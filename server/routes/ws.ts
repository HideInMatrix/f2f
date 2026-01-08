const peers = new Set<any>()

const rooms = new Map<
    String,
    {
        owner: User
        peers: Set<any>
        roomInfo: ClientBaseRoomInfo
    }
>()

/**
 * 向单个 peer 发送裁剪后的房间列表
 */
function sendRoomsToPeer(peer: any, type: WSMessageType = "rooms") {
    const ctx = peer.context as PeerContext

    const payload: ServerMessage = {
        type: type,
        rooms: Array.from(rooms.entries()).map(([roomId, room]) => {

            const base: ClientRoomInfo = {
                roomInfo: room.roomInfo,
                owner: room.owner,
                count: room.peers.size
            }

            // 只有加入了该房间，才能看到用户列表
            if (ctx.roomInfo?.roomId === roomId) {
                base.users = Array.from(room.peers).map((p: any) => ({
                    userId: (p.context as PeerContext)?.user?.userId === room.owner.userId ? room.owner.userId : 'unknown',
                    name: (p.context as PeerContext)?.user?.name || 'unknown'
                }))
            }

            return base
        })
    }

    peer.send(JSON.stringify(payload))
}

/**
 * 向所有 peer 广播（每人一份裁剪数据）
 */
function broadcastRooms(type?: WSMessageType) {
    for (const peer of peers) {
        sendRoomsToPeer(peer, type)
    }
}

export default defineWebSocketHandler({
    open(peer) {
        peers.add(peer)
        // 新连接立即下发房间列表
        sendRoomsToPeer(peer)
    },

    message(peer, message) {
        const data = JSON.parse(message.text()) as ClientMessage
        const ctx = peer.context as PeerContext

        /* ===== 请求房间列表 ===== */
        if (data.type === 'list') {
            sendRoomsToPeer(peer)
            return
        }

        /* ===== 创建房间 ===== */
        if (data.type === 'create-room') {
            if (rooms.has(data.roomInfo.roomId)) {
                peer.send(
                    JSON.stringify({
                        type: 'system',
                        message: '房间已存在'
                    })
                )
                return
            }

            rooms.set(data.roomInfo.roomId, {
                owner: data.owner,
                peers: new Set(),
                roomInfo: data.roomInfo
            })

            broadcastRooms()
            return
        }

        /* ===== 加入房间 ===== */
        if (data.type === 'join-room') {
            const room = rooms.get(data.roomId)
            if (!room) return

            // 如果之前在其他房间，先移除
            if (ctx.roomInfo) {
                const oldRoom = rooms.get(ctx.roomInfo.roomId)
                oldRoom?.peers.delete(peer)
            }

            ctx.roomInfo = room.roomInfo
            ctx.user = data.user
            room.peers.add(peer)

            broadcastRooms()
            return
        }

        /* ====== 离开房间 ========*/
        if (data.type === "leave-room") {
            if (!ctx.roomInfo) return

            const room = rooms.get(ctx.roomInfo.roomId)

            room?.peers.delete(peer)
            // ctx.room = undefined

            // if (room && room.peers.size === 0) {
            //     rooms.delete(roomName)
            // }

            broadcastRooms()
            return
        }

        /* ===== WebRTC 信令 ===== */
        if (data.type === 'signal') {
            const room = rooms.get(data.roomId)
            if (!room) return

            for (const p of room.peers) {
                if (p !== peer) {
                    p.send(
                        JSON.stringify({
                            type: 'signal',
                            data: data.data
                        })
                    )
                }
            }
        }
    },

    close(peer) {
        peers.delete(peer)

        const ctx = peer.context as PeerContext

        if (ctx.roomInfo?.roomId) {
            const room = rooms.get(ctx.roomInfo.roomId)
            room?.peers.delete(peer)

            // 如果房间空了，可以选择删除（可选）
            if (room && room.peers.size === 0) {
                rooms.delete(ctx.roomInfo.roomId)
            }
        }

        broadcastRooms()
    }
})