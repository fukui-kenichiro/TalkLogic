import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { AI_MODELS, checkIsPaid, type AiModelKey } from "@/lib/ai"
import { z } from "zod"

const bodySchema = z.object({
  model: z.string(),
})

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }

  const billing = await prisma.billing.findUnique({
    where: { userId: session.user.id },
    select: { plan: true, status: true, currentPeriodEnd: true },
  })
  if (!checkIsPaid(billing)) {
    return NextResponse.json(
      { error: "モデル選択はスタンダードプランのみご利用いただけます" },
      { status: 403 }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 })
  }

  const modelKey = parsed.data.model as AiModelKey
  if (!AI_MODELS[modelKey]) {
    return NextResponse.json({ error: "無効なモデルが指定されました" }, { status: 400 })
  }

  await (prisma.user.update as any)({
    where: { id: session.user.id },
    data: { preferredAiModel: modelKey },
  })

  return NextResponse.json({ success: true, model: modelKey })
}
