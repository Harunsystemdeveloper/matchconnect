'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Download, Trash2, Shield, FileJson, AlertTriangle, Eye, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DemographicsConsentCard } from '@/components/settings/demographics-consent-card'

export default function PrivacySettingsPage() {
  const router = useRouter()
  const [exporting, setExporting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function exportData() {
    setExporting(true)
    try {
      const res = await fetch('/api/gdpr/export')
      if (!res.ok) { toast.error('Export misslyckades'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'matchconnect-min-data.json'
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Din data har laddats ner!')
    } catch {
      toast.error('Något gick fel')
    } finally {
      setExporting(false)
    }
  }

  async function deleteAccount() {
    if (deleteConfirm !== 'RADERA') return
    setDeleting(true)
    const res = await fetch('/api/gdpr/delete', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); setDeleting(false); return }
    toast.success('Ditt konto har raderats')
    router.push('/')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Integritet & GDPR
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Hantera din data i enlighet med GDPR (dataskyddsförordningen)
        </p>
      </div>

      {/* Dina rättigheter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            Dina rättigheter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              right: 'Rätt till tillgång',
              desc: 'Du har rätt att få en kopia av all data vi lagrar om dig.',
              badge: 'Tillgänglig',
            },
            {
              right: 'Rätt till radering',
              desc: 'Du kan begära att vi raderar ditt konto och all associerad data.',
              badge: 'Tillgänglig',
            },
            {
              right: 'Rätt till portabilitet',
              desc: 'Ladda ner din data i ett maskinläsbart format (JSON).',
              badge: 'Tillgänglig',
            },
            {
              right: 'Rätt till rättelse',
              desc: 'Redigera din profil och CV-data när som helst via inställningar.',
              badge: 'Tillgänglig',
            },
          ].map(item => (
            <div key={item.right} className="flex items-start gap-3">
              <Lock className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{item.right}</p>
                  <Badge variant="outline" className="text-xs text-green-600 border-green-200">{item.badge}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      <DemographicsConsentCard />

      <Separator />

      {/* Exportera data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileJson className="h-4 w-4 text-primary" />
            Exportera min data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ladda ner en fullständig kopia av all data vi lagrar om dig: profil, CV, ansökningar, meddelanden och mer.
            Filen levereras i JSON-format.
          </p>
          <div className="rounded-lg bg-muted/50 border p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Inkluderar:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Profilinformation (namn, bio, plats)</li>
              <li>CV-data och AI-analys</li>
              <li>Alla ansökningar och status</li>
              <li>Sparade jobb</li>
              <li>Meddelandehistorik</li>
              <li>Företagsprofil (för rekryterare)</li>
            </ul>
          </div>
          <Button onClick={exportData} disabled={exporting} variant="outline">
            {exporting
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Exporterar...</>
              : <><Download className="mr-2 h-4 w-4" />Ladda ner min data</>
            }
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Radera konto */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <Trash2 className="h-4 w-4" />
            Radera konto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-destructive/5 border border-destructive/20 p-3">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">
              <strong>Varning:</strong> Detta är en permanent åtgärd. All din data raderas omedelbart och kan inte återställas.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Att radera ditt konto innebär att din profil, CV, alla ansökningar, meddelanden och övrig data
            permanent tas bort från våra servrar.
          </p>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Radera mitt konto
          </Button>
        </CardContent>
      </Card>

      {/* Bekräftelsedialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Bekräfta kontoborttagning
            </DialogTitle>
            <DialogDescription>
              Det här kan inte ångras. All din data raderas permanent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm">
              Skriv <strong>RADERA</strong> för att bekräfta att du vill ta bort ditt konto:
            </p>
            <Input
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="RADERA"
              className="font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Avbryt</Button>
            <Button
              variant="destructive"
              onClick={deleteAccount}
              disabled={deleteConfirm !== 'RADERA' || deleting}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Radera permanent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
