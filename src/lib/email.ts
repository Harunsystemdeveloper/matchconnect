import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = 'MatchConnect <noreply@matchconnect.se>'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://matchconnect.se'

async function send(options: Parameters<Resend['emails']['send']>[0]) {
  if (!resend) return
  try {
    await resend.emails.send(options)
  } catch (err) {
    console.error('[email] send failed:', err)
  }
}

export async function sendNewApplicationEmail({
  recruiterEmail,
  recruiterName,
  seekerName,
  jobTitle,
  jobId,
  applicationId,
}: {
  recruiterEmail: string
  recruiterName: string
  seekerName: string
  jobTitle: string
  jobId: string
  applicationId: string
}) {
  await send({
    from: FROM,
    to: recruiterEmail,
    subject: `Ny ansökan till ${jobTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <h2 style="margin-bottom:8px">Ny ansökan 📬</h2>
        <p>Hej ${recruiterName},</p>
        <p><strong>${seekerName}</strong> har sökt tjänsten <strong>${jobTitle}</strong>.</p>
        <p>
          <a href="${BASE_URL}/recruiter/jobs/${jobId}/candidates"
             style="display:inline-block;background:#6d28d9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Granska ansökan
          </a>
        </p>
        <p style="color:#666;font-size:13px">MatchConnect · AI-driven jobbmatchning för den svenska arbetsmarknaden</p>
      </div>
    `,
  })
}

export async function sendStatusUpdateEmail({
  seekerEmail,
  seekerName,
  jobTitle,
  newStatus,
  jobId,
}: {
  seekerEmail: string
  seekerName: string
  jobTitle: string
  newStatus: string
  jobId: string
}) {
  const statusLabels: Record<string, string> = {
    reviewed: 'Granskad',
    shortlisted: 'Shortlistad — du är ett steg närmre!',
    accepted: 'Accepterad — grattis!',
    rejected: 'Ej aktuell den här gången',
  }

  const label = statusLabels[newStatus]
  if (!label) return

  const isPositive = newStatus === 'shortlisted' || newStatus === 'accepted'

  await send({
    from: FROM,
    to: seekerEmail,
    subject: `Din ansökan till ${jobTitle}: ${label}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <h2 style="margin-bottom:8px">${isPositive ? '🎉' : '📋'} Uppdatering på din ansökan</h2>
        <p>Hej ${seekerName},</p>
        <p>Din ansökan till <strong>${jobTitle}</strong> har fått statusen: <strong>${label}</strong>.</p>
        ${newStatus === 'accepted' ? '<p>Rekryteraren kommer att höra av sig till dig inom kort.</p>' : ''}
        ${newStatus === 'rejected' ? '<p>Ge inte upp — det finns fler jobb som matchar din profil.</p>' : ''}
        <p>
          <a href="${BASE_URL}/seeker/jobs/${jobId}"
             style="display:inline-block;background:#6d28d9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Visa jobbet
          </a>
        </p>
        <p style="color:#666;font-size:13px">MatchConnect · AI-driven jobbmatchning för den svenska arbetsmarknaden</p>
      </div>
    `,
  })
}

export async function sendNewMessageEmail({
  recipientEmail,
  recipientName,
  senderName,
}: {
  recipientEmail: string
  recipientName: string
  senderName: string
}) {
  await send({
    from: FROM,
    to: recipientEmail,
    subject: `Nytt meddelande från ${senderName}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#111">
        <h2 style="margin-bottom:8px">Nytt meddelande 💬</h2>
        <p>Hej ${recipientName},</p>
        <p><strong>${senderName}</strong> har skickat dig ett meddelande på MatchConnect.</p>
        <p>
          <a href="${BASE_URL}/messages"
             style="display:inline-block;background:#6d28d9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Läs meddelandet
          </a>
        </p>
        <p style="color:#666;font-size:13px">MatchConnect · AI-driven jobbmatchning för den svenska arbetsmarknaden</p>
      </div>
    `,
  })
}
