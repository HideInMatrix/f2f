type Message = {
    name: string
    userId: string
    message: { imgUrl?: string, text?: string, videoUrl?: string, audioUrl?: string }
}

type RoomMessage = {
    roomId: string
    roomName: string
    messages: Message[]
}

