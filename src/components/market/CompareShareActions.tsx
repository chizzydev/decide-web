'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { absoluteUrl } from '@/lib/seo'
import {
  buildCompareSnapshotSvg,
  sanitizeCompareSnapshotFileName,
  type CompareSnapshotData,
} from './compareSnapshot'

interface CompareShareActionsProps {
  shareHref: string
  title: string
  text: string
  downloadSnapshot: CompareSnapshotData
  downloadName: string
}

const RESET_DELAY_MS = 2200

export const CompareShareActions = ({
  shareHref,
  title,
  text,
  downloadSnapshot,
  downloadName,
}: CompareShareActionsProps) => {
  const shareUrl = useMemo(() => absoluteUrl(shareHref), [shareHref])
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [shareState, setShareState] = useState<'idle' | 'shared' | 'failed'>('idle')
  const [downloadState, setDownloadState] = useState<
    'idle' | 'downloaded' | 'failed'
  >('idle')
  const resetTimerRef = useRef<number | null>(null)
  const canUseNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  const scheduleReset = () => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current)
    }

    resetTimerRef.current = window.setTimeout(() => {
      setCopyState('idle')
      setShareState('idle')
      setDownloadState('idle')
    }, RESET_DELAY_MS)
  }

  const copyText = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = shareUrl
        textArea.setAttribute('readonly', 'true')
        textArea.style.position = 'absolute'
        textArea.style.left = '-9999px'
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }

      setCopyState('copied')
      setShareState('idle')
      scheduleReset()
      return true
    } catch {
      setCopyState('failed')
      scheduleReset()
      return false
    }
  }

  const handleCopy = async () => {
    await copyText()
  }

  const handleShare = async () => {
    if (!canUseNativeShare) {
      await copyText()
      return
    }

    try {
      await navigator.share({
        title,
        text,
        url: shareUrl,
      })
      setShareState('shared')
      setCopyState('idle')
      scheduleReset()
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === 'AbortError'
      ) {
        return
      }

      setShareState('failed')
      scheduleReset()
    }
  }

  const handleDownload = async () => {
    try {
      const svg = buildCompareSnapshotSvg(downloadSnapshot)
      const blob = new Blob([svg], {
        type: 'image/svg+xml;charset=utf-8',
      })
      const objectUrl = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = `${sanitizeCompareSnapshotFileName(downloadName)}.svg`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      window.URL.revokeObjectURL(objectUrl)
      setDownloadState('downloaded')
      scheduleReset()
    } catch {
      setDownloadState('failed')
      scheduleReset()
    }
  }

  const copyLabel =
    copyState === 'copied'
      ? 'Link copied'
      : copyState === 'failed'
        ? 'Copy failed'
        : 'Copy compare link'

  const shareLabel =
    shareState === 'shared'
      ? 'Shared'
      : shareState === 'failed'
        ? 'Share failed'
        : canUseNativeShare
          ? 'Share comparison'
          : 'Share or copy'

  const downloadLabel =
    downloadState === 'downloaded'
      ? 'Snapshot downloaded'
      : downloadState === 'failed'
        ? 'Download failed'
        : 'Download snapshot'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
      >
        {copyLabel}
      </button>
      <button
        type="button"
        onClick={handleDownload}
        className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-text-secondary transition-colors duration-fast hover:border-borderHigh hover:text-text-primary"
      >
        {downloadLabel}
      </button>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center justify-center rounded-full border border-teal-600/30 bg-tealTint px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-700 transition-colors duration-fast hover:border-teal-600/40 hover:bg-accent-subtle"
      >
        {shareLabel}
      </button>
    </div>
  )
}
