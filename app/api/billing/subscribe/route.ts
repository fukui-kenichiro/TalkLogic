import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { createPaymentLink } from "@/lib/square"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }

  const billing = await prisma.billing.findUnique({
    where: { userId: session.user.id },
  })

  if (billing?.plan === "standard" && billing?.status === "active") {
    return NextResponse.json(
      { error: "既にスタンダードプランに加入しています" },
      { status: 400 }
    )
  }

  const sessionId = randomBytes(24).toString("hex")
  const idempotencyKey = randomBytes(16).toString("hex")

  // NEXTAUTH_URL よりリクエストの origin を優先（Vercel デプロイ環境で確実）
  const origin = new URL(req.url).origin
  const redirectUrl = `${origin}/api/billing/payment-return?session=${sessionId}`

  const result = await createPaymentLink({
    idempotencyKey,
    name: "TalkLogic スタンダードプラン（月額500円）",
    amountJpy: 500,
    redirectUrl,
  })

  if (result.errors) {
    const detail = JSON.stringify(result.errors)
    console.error("Square createPaymentLink error:", detail)
    return NextResponse.json(
      { error: `決済リンクの作成に失敗しました: ${detail}` },
      { status: 500 }
    )
  }

  const checkoutUrl = result.payment_link?.url
  const orderId = result.payment_link?.order_id ?? null

  await prisma.billing.upsert({
    where: { userId: session.user.id },
    update: { squareSessionId: sessionId, squareOrderId: orderId },
    create: {
      userId: session.user.id,
      plan: "free",
      status: "active",
      squareSessionId: sessionId,
      squareOrderId: orderId,
    },
  })

  return NextResponse.json({ checkout_url: checkoutUrl, session_id: sessionId })
}
