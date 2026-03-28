import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }

  const billing = await prisma.billing.findUnique({
    where: { userId: session.user.id },
    select: {
      plan: true,
      status: true,
      currentPeriodEnd: true,
    },
  })

  return NextResponse.json(
    billing ?? { plan: "free", status: "active", currentPeriodEnd: null }
  )
}
