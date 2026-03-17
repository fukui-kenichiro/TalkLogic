import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { cancelSubscription } from "@/lib/payjp"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }

  const billing = await prisma.billing.findUnique({
    where: { userId: session.user.id },
  })

  if (!billing?.payjpSubscriptionId) {
    return NextResponse.json({ error: "有効なサブスクリプションが見つかりません" }, { status: 400 })
  }

  if (billing.status === "canceled") {
    return NextResponse.json({ error: "既に解約済みです" }, { status: 400 })
  }

  // PAY.JP: 期間終了時に解約
  const result = await cancelSubscription(billing.payjpSubscriptionId)
  if (result.error) {
    return NextResponse.json(
      { error: result.error.message ?? "解約処理に失敗しました" },
      { status: 400 }
    )
  }

  // DB: status を canceled に更新（currentPeriodEnd はそのまま保持）
  await prisma.billing.update({
    where: { userId: session.user.id },
    data: { status: "canceled" },
  })

  return NextResponse.json({ success: true })
}
