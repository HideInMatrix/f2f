import { ref, shallowRef } from 'vue'
import { useWsClient } from './useWsClient'
import { useUserMessageStore } from '#imports'

export function useChat(roomId: string, user: User) {
    /* ========================
       状态
    ======================== */

    const userMessageStore = useUserMessageStore()

    const messages = computed(() => userMessageStore.getRoomMessages(roomId))

    const localStream = shallowRef<MediaStream | null>(null)
    const remoteStream = shallowRef<MediaStream | null>(null)

    const isChannelOpen = ref(false)
    const connectionState = ref<WebRTCStatus>('idle')

    /* ========================
       WebSocket 信令
    ======================== */

    const { send: sendSignal, onMessage } = useWsClient()

    /* ========================
       RTCPeerConnection
    ======================== */

    const config = useRuntimeConfig();
    const pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            {
                urls: config.public.turnUrl,
                username: config.public.turnUser,
                credential: config.public.turnPassword
            }
            // ⚠️ 生产环境必须加 TURN
        ]
    })

    let started = false
    let channel: RTCDataChannel | null = null

    /* ========================
       DataChannel
    ======================== */

    function bindDataChannel() {
        if (!channel) return

        channel.onopen = () => {
            isChannelOpen.value = true
            connectionState.value = 'connected'
            console.log('[DataChannel] open')
        }

        channel.onclose = () => {
            isChannelOpen.value = false
            connectionState.value = 'failed'
        }

        channel.onerror = (e) => {
            console.error('[DataChannel] error', e)
            connectionState.value = 'failed'
        }

        channel.onmessage = (e) => {
            userMessageStore.setMessageToStorage(roomId, JSON.parse(e.data))
        }
    }

    pc.ondatachannel = (e) => {
        channel = e.channel
        bindDataChannel()
    }

    /* ========================
       ICE
    ======================== */

    pc.onicecandidate = (e) => {
        if (e.candidate) {
            console.log('[ICE candidate]', e.candidate.candidate)
            sendSignal({
                type: 'signal',
                roomId,
                data: { ice: e.candidate }
            })
        }
    }

    pc.oniceconnectionstatechange = () => {
        console.log('[ICE]', pc.iceConnectionState)
        if (pc.iceConnectionState === 'failed') {
            connectionState.value = 'failed'
        }
    }

    /* ========================
       Media Track
    ======================== */

    pc.ontrack = (e) => {
        if (!remoteStream.value) {
            remoteStream.value = new MediaStream()
        }
        remoteStream.value.addTrack(e.track)
    }

    async function initLocalMedia() {
        if (localStream.value) return

        localStream.value = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })

        // ⚠️ Safari / iOS 必须在 createOffer 前 addTrack
        localStream.value.getTracks().forEach((track) => {
            pc.addTrack(track, localStream.value!)
        })
    }

    /* ========================
       信令处理 用户相互交换的ICE信息链接
    ======================== */

    onMessage(async (msg) => {
        if (msg.type !== 'signal') return

        const data = msg.data

        if (data.offer && !started) {
            started = true
            connectionState.value = 'connecting'

            // await initLocalMedia()

            await pc.setRemoteDescription(data.offer)
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)

            sendSignal({
                type: 'signal',
                roomId,
                data: { answer }
            })
        }

        if (data.answer) {
            await pc.setRemoteDescription(data.answer)
        }

        if (data.ice) {
            await pc.addIceCandidate(data.ice)
        }
    })

    /* ========================
       主动发起（房主）
    ======================== */

    async function start() {
        if (started) return

        started = true
        connectionState.value = 'connecting'

        // await initLocalMedia()

        channel = pc.createDataChannel('chat')
        bindDataChannel()

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        sendSignal({
            type: 'signal',
            roomId,
            data: { offer }
        })
    }

    /**
 * 房主在检测到有新成员加入房间时调用
 * 作用：重新发起一次 offer，让新加入的成员能够完成 ICE 交换
 */
    async function restartIceForNewPeer() {
        if (pc.signalingState !== 'stable') {
            console.warn('[WebRTC] signalingState not stable, skip restart')
            return
        }

        connectionState.value = 'connecting'

        const offer = await pc.createOffer({ iceRestart: true })
        await pc.setLocalDescription(offer)

        sendSignal({
            type: 'signal',
            roomId,
            data: { offer }
        })

        console.log('[WebRTC] ICE restart offer sent for new peer')
    }


    /* ========================
       发送消息
    ======================== */

    function sendMessage(roomId: string, text: string) {
        if (!channel || channel.readyState !== 'open') { return }
        const payload = { userId: user.userId, name: user.name, message: { text } }
        channel.send(JSON.stringify(payload))
        userMessageStore.setMessageToStorage(roomId, payload)
    }

    return {
        /* 聊天 */
        messages,
        sendMessage,

        /* 视频 */
        localStream,
        remoteStream,

        /* 连接 */
        start,
        restartIceForNewPeer,
        isChannelOpen,
        connectionState
    }
}