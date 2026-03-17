import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { FREE_ACTIVITY_LIMIT, checkIsPaid, currentMonthRange } from "@/lib/ai"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }

  const billing = await prisma.billing.findUnique({
    where: { userId: session.user.id },
    select: { plan: true, status: true, currentPeriodEnd: true },
  })
  const isPaid = checkIsPaid(billing)

  if (isPaid) {
    return NextResponse.json({ used: null, limit: null, isPaid: true })
  }

  const { start, end } = currentMonthRange()
  const used = await prisma.activity.count({
    where: { userId: session.user.id, activityDate: { gte: start, lte: end } },
  })

  return NextResponse.json({
    used,
    limit: FREE_ACTIVITY_LIMIT,
    remaining: Math.max(0, FREE_ACTIVITY_LIMIT - used),
    isPaid: false,
  })
}
