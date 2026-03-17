import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { FREE_AI_LIMIT, checkIsPaid, currentYearMonth, AI_MODELS, type AiModelKey } from "@/lib/ai"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }

  const [billing, user] = await Promise.all([
    prisma.billing.findUnique({
      where: { userId: session.user.id },
      select: { plan: true, status: true, currentPeriodEnd: true },
    }),
    (prisma.user.findUnique as any)({
      where: { id: session.user.id },
      select: { preferredAiModel: true },
    }),
  ])

  const isPaid = checkIsPaid(billing)
  const yearMonth = currentYearMonth()

  const usageLog = await (prisma as any).aiUsageLog.findUnique({
    where: { userId_yearMonth: { userId: session.user.id, yearMonth } },
  })
  const used: number = usageLog?.count ?? 0

  // 無料プランは常に claude-haiku 固定
  const modelKey: AiModelKey = isPaid
    ? ((user?.preferredAiModel as AiModelKey | undefined) ?? "claude-haiku")
    : "claude-haiku"

  return NextResponse.json({
    used,
    limit: isPaid ? null : FREE_AI_LIMIT,
    remaining: isPaid ? null : Math.max(0, FREE_AI_LIMIT - used),
    isPaid,
    modelKey,
    modelLabel: AI_MODELS[modelKey]?.label ?? modelKey,
  })
}
