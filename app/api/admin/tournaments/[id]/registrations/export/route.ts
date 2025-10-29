import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const tournamentId = params.id
    if (!tournamentId) return NextResponse.json({ error: 'Missing tournament id' }, { status: 400 })

    const regs = await prisma.registration.findMany({ where: { tournamentId }, orderBy: { createdAt: 'asc' } })

    const parsed = (regs as Array<Record<string, unknown>>).map((r) => {
      const leader = typeof (r as any).leader === 'string' ? JSON.parse((r as any).leader || '{}') : (r as any).leader || {}
      const members = typeof (r as any).members === 'string' ? JSON.parse((r as any).members || '[]') : (r as any).members || []
      return { ...r, leader, members }
    })

    const maxMembers = parsed.reduce((max, r) => Math.max(max, Array.isArray((r as any).members) ? ((r as any).members as Array<unknown>).length : 0), 0)

    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Registrations')

    // Build headers
    const headers: Array<Record<string, unknown>> = [
      { header: 'ID', key: 'id', width: 36 },
      { header: 'Team', key: 'teamName', width: 20 },
      { header: 'University', key: 'university', width: 20 },
      { header: 'Phone', key: 'phone', width: 16 },
      { header: 'Leader Name', key: 'leader_name', width: 20 },
      { header: 'Leader Email', key: 'leader_email', width: 30 },
      { header: 'Leader RegNo', key: 'leader_registrationNo', width: 18 },
      { header: 'Leader Game ID', key: 'leader_gameId', width: 18 },
    ]

    for (let i = 1; i <= maxMembers; i++) {
      headers.push({ header: `Member ${i} Name`, key: `member${i}_name`, width: 20 })
      headers.push({ header: `Member ${i} RegNo`, key: `member${i}_registrationNo`, width: 18 })
      headers.push({ header: `Member ${i} Email`, key: `member${i}_email`, width: 30 })
      headers.push({ header: `Member ${i} Game ID`, key: `member${i}_gameId`, width: 18 })
    }

    headers.push({ header: 'Registered At', key: 'createdAt', width: 24 })

    sheet.columns = headers as any

    // Add rows
    for (const r of parsed) {
      const row: Record<string, unknown> = {
        id: (r as any).id,
        teamName: (r as any).teamName,
        university: (r as any).university,
        phone: (r as any).phone ?? '',
        leader_name: (r as any).leader?.name ?? '',
        leader_email: (r as any).leader?.email ?? '',
        leader_registrationNo: (r as any).leader?.registrationNo ?? '',
        leader_gameId: (r as any).leader?.gameId ?? '',
      }

      for (let i = 0; i < maxMembers; i++) {
        const m = (r as any).members?.[i]
        row[`member${i + 1}_name`] = m?.name ?? ''
        row[`member${i + 1}_registrationNo`] = m?.registrationNo ?? ''
        row[`member${i + 1}_email`] = m?.email ?? ''
        row[`member${i + 1}_gameId`] = m?.gameId ?? ''
      }

      row.createdAt = (r as any).createdAt ? new Date((r as any).createdAt as string).toISOString() : ''

      sheet.addRow(row)
    }

    // Styling: header bold
    sheet.getRow(1).font = { bold: true }

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=registrations-${tournamentId}.xlsx`,
      },
    })
  } catch (err: unknown) {
    console.error('Failed to generate XLSX export', err)
    const message = err instanceof Error ? err.message : String(err)
    // fallback to CSV
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
