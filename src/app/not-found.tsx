import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Briefcase, ArrowRight, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="text-center max-w-md">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary mx-auto mb-6 shadow-lg shadow-primary/25">
            <Briefcase className="h-9 w-9 text-white" />
          </div>
          <p className="text-8xl font-black gradient-text mb-4">404</p>
          <h1 className="text-2xl font-bold mb-3">Sidan hittades inte</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Den här sidan verkar inte finnas — precis som rätt kandidat innan MatchConnect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Tillbaka till startsidan
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register">
                Skapa konto
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
