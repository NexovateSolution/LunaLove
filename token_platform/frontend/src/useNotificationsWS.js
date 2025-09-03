import { useEffect, useRef, useState } from 'react'

/**
 * Simple WebSocket notifications hook.
 * Auth: dev-only numeric user id as token.
 * Usage:
 *   const { connected, lastEvent } = useNotificationsWS(user.id, (evt) => toast(evt.event))
 */
export default function useNotificationsWS(userId, onEvent) {
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState(null)
  const wsRef = useRef(null)
  const retryRef = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!userId) return

    const connect = () => {
      try {
        const wsOrigin = window.location.origin.replace(/^http/, 'ws')
        const url = new URL('/ws/notifications/', wsOrigin)
        url.searchParams.set('token', String(userId))

        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          setConnected(true)
          retryRef.current = 0
        }
        ws.onclose = () => {
          setConnected(false)
          // Reconnect with backoff up to ~10s
          const delay = Math.min(10000, 500 * Math.pow(2, retryRef.current++))
          clearTimeout(timerRef.current)
          timerRef.current = setTimeout(connect, delay)
        }
        ws.onerror = () => {
          ws.close()
        }
        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data)
            setLastEvent(data)
            if (onEvent) onEvent(data)
          } catch (_) {
            // ignore
          }
        }
      } catch (e) {
        // try again later
        const delay = Math.min(10000, 500 * Math.pow(2, retryRef.current++))
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(connect, delay)
      }
    }

    connect()
    return () => {
      clearTimeout(timerRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [userId, onEvent])

  return { connected, lastEvent }
}
