import {TileCoordinates} from "./runescape/coordinates"
import {Transportation} from "./runescape/transportation"

export class StreamDeckBridge {
  private static ws: WebSocket | null = null
  private static readonly PORT = 57832
  private static reconnectTimer: ReturnType<typeof setTimeout> | null = null

  static connect(): void {
    const tryConnect = () => {
      if (StreamDeckBridge.ws?.readyState === WebSocket.CONNECTING) return

      const ws = new WebSocket(`ws://127.0.0.1:${StreamDeckBridge.PORT}`)

      ws.onopen = () => {
        console.log("[StreamDeck] Connected")
        StreamDeckBridge.ws = ws
        if (StreamDeckBridge.reconnectTimer) {
          clearTimeout(StreamDeckBridge.reconnectTimer)
          StreamDeckBridge.reconnectTimer = null
        }
      }
      ws.onclose = () => {
        StreamDeckBridge.ws = null
        StreamDeckBridge.reconnectTimer = setTimeout(tryConnect, 5000)
      }
      ws.onerror = () => ws.close()
    }

    tryConnect()
  }

  static push(target: TileCoordinates, spots: Transportation.TeleportGroup.Spot[]): void {
    if (StreamDeckBridge.ws?.readyState !== WebSocket.OPEN) return

    const teleports = spots
      .filter(s => s.code() && s.spot.target?.origin)
      .map(s => ({
        name: s.hover(),
        spot: {
          x: s.spot.target.origin.x,
          y: s.spot.target.origin.y,
        },
        keybind: s.code(),
      }))

    StreamDeckBridge.ws.send(JSON.stringify({
      target: {x: target.x, y: target.y},
      teleports,
    }))
  }

  static clear(): void {
    if (StreamDeckBridge.ws?.readyState !== WebSocket.OPEN) return
    StreamDeckBridge.ws.send(JSON.stringify({target: null, teleports: []}))
  }
}