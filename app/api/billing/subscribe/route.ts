import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { createCustomer, createSubscription } from "@/lib/payjp"
import { z } from "zod"

const bodySchema = z.object({
  token: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "トークンが不正です" }, { status: 400 })
  }

  const planId = process.env.PAYJP_PLAN_ID
  if (!planId) {
    console.error("PAYJP_PLAN_ID is not set")
    return NextResponse.json({ error: "サーバー設定エラーです" }, { status: 500 })
  }

  // 既存の課金レコードを確認
  const billing = await prisma.billing.findUnique({
    where: { userId: session.user.id },
  })

  if (billing?.plan === "standard" && billing?.status === "active") {
    return NextResponse.json({ error: "既にスタンダードプランに加入しています" }, { status: 400 })
  }

  // PAY.JP: 顧客作成（既存顧客IDがあれば再利用しない → 新規トークンで作成）
  const customer = await createCustomer(parsed.data.token)
  if (customer.error) {
    return NextResponse.json(
      { error: customer.error.message ?? "カード登録に失敗しました" },
      { status: 400 }
    )
  }

  // PAY.JP: サブスクリプション作成
  const subscription = await createSubscription(customer.id, planId)
  if (subscription.error) {
    return NextResponse.json(
      { error: subscription.error.message ?? "プラン登録に失敗しました" },
      { status: 400 }
    )
  }

  // DB 更新
  await prisma.billing.upsert({
    where: { userId: session.user.id },
    update: {
      plan: "standard",
      status: "active",
      payjpCustomerId: customer.id,
      payjpSubscriptionId: subscription.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
    create: {
      userId: session.user.id,
      plan: "standard",
      status: "active",
      payjpCustomerId: customer.id,
      payjpSubscriptionId: subscription.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  })

  return NextResponse.json({ success: true })
}
