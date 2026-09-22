'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react'

export interface AudioPlayerProps {
  audioUrl: string
  title?: string
  maxAttempts?: number
  onEnded?: () => void
}

export function AudioPlayer({ audioUrl, title, maxAttempts = 2, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [attemptsUsed, setAttemptsUsed] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => setDuration(audio.duration || 0)
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime || 0)
    const handleAudioEnded = () => {
      setIsPlaying(false)
      setAttemptsUsed((prev) => prev + 1)
      if (onEnded) onEnded()
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleAudioEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleAudioEnded)
    }
  }, [onEnded])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      if (attemptsUsed >= maxAttempts) return
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const newTime = Number(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const newVol = Number(e.target.value)
    audio.volume = newVol
    setVolume(newVol)
    setIsMuted(newVol === 0)
  }

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const isLimitReached = attemptsUsed >= maxAttempts

  return (
    <div className="border border-border/80 rounded-xl p-4 bg-card/60 space-y-3">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="flex items-center justify-between">
        <div>
          <strong className="text-sm font-semibold text-foreground block">{title || 'Audio Passage'}</strong>
          <span className="text-xs text-muted-foreground">
            Plays: {attemptsUsed} / {maxAttempts} attempts used
          </span>
        </div>
        {isLimitReached && (
          <span className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded">
            Max plays reached
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          disabled={isLimitReached}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-opacity"
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <div className="flex-1 space-y-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            disabled={isLimitReached}
            className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pl-2 border-l border-border">
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 text-muted-foreground hover:text-foreground"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 accent-primary h-1 bg-muted rounded appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  )
}
