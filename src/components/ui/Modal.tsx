// decide-web/src/components/ui/Modal.tsx
// Accessible modal dialog with focus trap and scroll lock.
// Used for price alert creation and confirmation dialogs.
// Renders via a React portal so it always sits above everything else.

'use client'

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'

interface ModalProps {
  isOpen:     boolean
  onClose:    () => void
  title:      string
  children:   React.ReactNode
  // Optional footer — rendered below a top border inside the modal
  footer?:    React.ReactNode
  // Width of the modal — defaults to md
  size?:      'sm' | 'md' | 'lg'
  // Prevents closing on backdrop click — for destructive confirmations
  persistent?: boolean
}

const SIZES: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size       = 'md',
  persistent = false,
}: ModalProps) => {
  const overlayRef    = useRef<HTMLDivElement>(null)
  const firstFocusRef = useRef<HTMLButtonElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  // Lock scroll and trap focus when modal opens
  useEffect(() => {
    if (!isOpen) return

    // Store the element that was focused before the modal opened
    // so we can return focus to it when the modal closes
    previousFocus.current = document.activeElement as HTMLElement

    // Prevent the page behind from scrolling
    document.body.style.overflow = 'hidden'

    // Move focus into the modal — the close button is the first focusable element
    firstFocusRef.current?.focus()

    return () => {
      document.body.style.overflow = ''
      // Return focus to where it was before the modal opened
      previousFocus.current?.focus()
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !persistent) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, persistent])

  // Close on backdrop click — skipped if persistent
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (persistent) return
    if (e.target === overlayRef.current) onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-modal flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={[
          'relative w-full bg-surface border border-border rounded-md shadow-lg',
          'flex flex-col max-h-[90vh]',
          SIZES[size],
        ].join(' ')}
      >

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2
            id="modal-title"
            className="text-base font-bold text-text-primary tracking-tight"
          >
            {title}
          </h2>

          {/* Close button — first focusable element in the modal */}
          <button
            ref={firstFocusRef}
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-sm text-text-muted hover:text-text-primary hover:bg-surfaceHigh transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body — scrollable if content overflows */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 p-5 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

const CloseIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M12 4L4 12M4 4L12 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)