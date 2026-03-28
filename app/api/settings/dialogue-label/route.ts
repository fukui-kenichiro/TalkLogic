import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const bodySchema = z.object({
  label: z.string().min(1).max(20),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }

  const user = await (prisma.user.findUnique as any)({
    where: { id: session.user.id },
    select: { dialogueCountLabel: true },
  })

  return NextResponse.json({ label: user?.dialogueCountLabel ?? "対話人数" })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 })
  }

  await (prisma.user.update as any)({
    where: { id: session.user.id },
    data: { dialogueCountLabel: parsed.data.label },
  })

  return NextResponse.json({ success: true, label: parsed.data.label })
}
