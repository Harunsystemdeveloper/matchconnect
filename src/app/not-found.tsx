import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Briefcase } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-6">
        <Briefcase className="h-6 w-6 text-primary" />
      </div>
      <h1 className="text-6xl font-bold text-muted-foreground/30 mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-2">Sidan hittades inte</h2>
      <p className="text-muted-foreground mb-8 max-w-sm">
        Sidan du letar efter finns inte eller har flyttats.
      </p>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/">Tillbaka till startsidan</Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard">Till dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
