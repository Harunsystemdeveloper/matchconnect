'use client'

import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  end: number
  decimals?: number
  duration?: number
  prefix?: string
  suffix?: string
  separator?: string   // thousands separator, e.g. ' '
  className?: string
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export function CountUp({
  end,
  decimals = 0,
  duration = 2000,
  prefix = '',
  suffix = '',
  separator = '',
  className,
}: CountUpProps) {
  const [value, setValue] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const frameRef = useRef<number>(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    const startTime = performance.now()

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutExpo(progress)
      setValue(easedProgress * end)
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        setValue(end)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [started, end, duration])

  const formatted = (() => {
    const fixed = value.toFixed(decimals)
    if (!separator) return fixed
    const [int, dec] = fixed.split('.')
    const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    return dec !== undefined ? `${withSep},${dec}` : withSep
  })()

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  )
}
