'use client'

import { useEffect } from 'react'

export function JobViewTracker({ jobId }: { jobId: string }) {
  useEffect(() => {
    fetch('/api/jobs/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId }),
    }).catch(() => null)
  }, [jobId])

  return null
}
