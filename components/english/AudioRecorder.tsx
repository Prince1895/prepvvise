'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Mic, Square, Play, Pause, RotateCcw, CheckCircle2, AlertCircle, Volume2, VolumeX } from 'lucide-react'

export interface AudioRecorderProps {
  maxDurationSeconds?: number
  onRecordingComplete?: (audioBlob: Blob, audioUrl: string) => void
}

function getSupportedMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return ''
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
    'audio/wav',
  ]
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

export function AudioRecorder({ maxDurationSeconds = 120, onRecordingComplete }: AudioRecorderProps) {
  const [status, setStatus] = useState<'idle' | 'recording' | 'recorded' | 'permission_denied'>('idle')
  const [secondsRecorded, setSecondsRecorded] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Audio playback refs (HTML5 + Web Audio API fallback)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const decodedBufferRef = useRef<AudioBuffer | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null)
  const startTimeRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close() } catch {}
      }
    }
  }, [audioUrl])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    audio.src = audioUrl
    audio.load()

    const handleLoadedMetadata = () => {
      if (isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(audio.duration)
      }
    }

    const handleTimeUpdate = () => {
      setPlaybackTime(audio.currentTime || 0)
    }

    const handleAudioEnded = () => {
      setIsPlaying(false)
      setPlaybackTime(0)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleAudioEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleAudioEnded)
    }
  }, [audioUrl])

  // Timer to update playback progress during Web Audio API or HTML5 playback
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      if (audioRef.current && !audioRef.current.paused) {
        setPlaybackTime(audioRef.current.currentTime)
      } else if (audioCtxRef.current && startTimeRef.current !== null) {
        const elapsed = audioCtxRef.current.currentTime - startTimeRef.current
        const maxDur = audioDuration || secondsRecorded
        if (elapsed >= maxDur) {
          setIsPlaying(false)
          setPlaybackTime(0)
        } else {
          setPlaybackTime(elapsed)
        }
      }
    }, 100)
    return () => clearInterval(interval)
  }, [isPlaying, audioDuration, secondsRecorded])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []

      const mimeType = getSupportedMimeType()
      const options = mimeType ? { mimeType } : undefined
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const rawType = mediaRecorderRef.current?.mimeType || mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: rawType })

        if (audioBlob.size === 0) {
          console.error('Recorded blob is empty')
          setStatus('idle')
          return
        }

        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)
        setStatus('recorded')
        setIsPlaying(false)
        setPlaybackTime(0)

        // Try pre-decoding audio buffer for Web Audio API fallback
        try {
          const arrayBuffer = await audioBlob.arrayBuffer()
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          const tempCtx = new AudioContextClass()
          const decoded = await tempCtx.decodeAudioData(arrayBuffer)
          decodedBufferRef.current = decoded
          if (decoded.duration > 0) {
            setAudioDuration(decoded.duration)
          }
          await tempCtx.close()
        } catch (e) {
          console.warn('Web Audio pre-decode warning:', e)
        }

        if (onRecordingComplete) {
          onRecordingComplete(audioBlob, url)
        }
        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop())
      }

      // Collect data continuously
      mediaRecorder.start(500)
      setStatus('recording')
      setSecondsRecorded(0)

      timerRef.current = setInterval(() => {
        setSecondsRecorded((prev) => {
          if (prev + 1 >= maxDurationSeconds) {
            stopRecording()
            return maxDurationSeconds
          }
          return prev + 1
        })
      }, 1000)
    } catch {
      setStatus('permission_denied')
    }
  }

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  const resetRecording = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop() } catch {}
      sourceNodeRef.current = null
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close() } catch {}
      audioCtxRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
    }
    decodedBufferRef.current = null
    setIsPlaying(false)
    setPlaybackTime(0)
    setAudioDuration(0)
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioUrl(null)
    setSecondsRecorded(0)
    setStatus('idle')
  }

  const togglePlay = async () => {
    if (isPlaying) {
      // Pause/stop current playback
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop() } catch {}
        sourceNodeRef.current = null
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setIsPlaying(false)
      return
    }

    // 1. Try playing via HTML5 <audio> element first
    const audio = audioRef.current
    if (audio && audioUrl) {
      try {
        if (!audio.src || audio.src !== audioUrl) {
          audio.src = audioUrl
          audio.load()
        }
        audio.currentTime = playbackTime
        await audio.play()
        setIsPlaying(true)
        return
      } catch (err) {
        console.warn('HTML5 <audio> playback failed, attempting Web Audio API fallback:', err)
      }
    }

    // 2. Fallback to Web Audio API if HTML5 <audio> threw NotSupportedError
    if (decodedBufferRef.current) {
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const audioCtx = new AudioContextClass()
        audioCtxRef.current = audioCtx

        const source = audioCtx.createBufferSource()
        source.buffer = decodedBufferRef.current
        source.connect(audioCtx.destination)

        const offset = Math.min(playbackTime, decodedBufferRef.current.duration || secondsRecorded)
        source.start(0, offset)
        sourceNodeRef.current = source
        startTimeRef.current = audioCtx.currentTime - offset
        setIsPlaying(true)

        source.onended = () => {
          setIsPlaying(false)
          setPlaybackTime(0)
        }
      } catch (fallbackErr) {
        console.error('Web Audio API playback failed:', fallbackErr)
        setIsPlaying(false)
      }
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = Number(e.target.value)
    setPlaybackTime(target)

    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.currentTime = target
    } else if (isPlaying && decodedBufferRef.current) {
      // Restart Web Audio API at new position
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop() } catch {}
      }
      if (audioCtxRef.current) {
        const source = audioCtxRef.current.createBufferSource()
        source.buffer = decodedBufferRef.current
        source.connect(audioCtxRef.current.destination)
        source.start(0, target)
        sourceNodeRef.current = source
        startTimeRef.current = audioCtxRef.current.currentTime - target
        source.onended = () => {
          setIsPlaying(false)
          setPlaybackTime(0)
        }
      }
    }
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (audio) {
      audio.muted = !isMuted
    }
    setIsMuted(!isMuted)
  }

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '00:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const effectiveDuration = audioDuration > 0 ? audioDuration : secondsRecorded

  return (
    <div className="border border-border/80 rounded-xl p-4 bg-card/60 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-primary" /> Speech Audio Recorder
        </span>
        {status === 'recording' && (
          <span className="flex items-center gap-1.5 text-xs text-rose-500 font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 block" /> Recording ({formatTime(secondsRecorded)} / {formatTime(maxDurationSeconds)})
          </span>
        )}
      </div>

      {status === 'permission_denied' && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Microphone access was denied. Please allow microphone permissions in your browser.</span>
        </div>
      )}

      {status === 'idle' && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full py-3 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Mic className="w-4 h-4" /> Start Speaking Recording
        </button>
      )}

      {status === 'recording' && (
        <button
          type="button"
          onClick={stopRecording}
          className="w-full py-3 px-4 rounded-lg bg-rose-600 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-rose-700 transition-colors"
        >
          <Square className="w-4 h-4 fill-current" /> Stop Recording ({formatTime(secondsRecorded)})
        </button>
      )}

      {status === 'recorded' && audioUrl && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Recording captured ({formatTime(secondsRecorded)})
          </div>

          <audio ref={audioRef} src={audioUrl} preload="auto" className="hidden" />

          {/* Custom audio playback controls that reliably play recorded speech audio */}
          <div className="flex items-center gap-3 p-2.5 bg-background border border-border rounded-lg">
            <button
              type="button"
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={effectiveDuration || 1}
                step={0.1}
                value={playbackTime}
                onChange={handleSeek}
                className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                {formatTime(playbackTime)} / {formatTime(effectiveDuration)}
              </span>
            </div>

            <button
              type="button"
              onClick={toggleMute}
              className="p-1 text-muted-foreground hover:text-foreground shrink-0"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetRecording}
              className="secondary-button text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Re-record
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
