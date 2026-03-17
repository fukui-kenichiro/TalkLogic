import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import prisma from "@/lib/prisma"

// PAY.JP Webhook署名検証
function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const hmac = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")
  return hmac === signature
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get("payjp-signature") ?? ""
  const webhookSecret = process.env.PAYJP_WEBHOOK_SECRET ?? ""

  // Webhook Secretが設定されている場合のみ署名検証
  if (webhookSecret && !verifySignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: "署名が不正です" }, { status: 400 })
  }

  let event: { type: string; data: { object: Record<string, unknown> } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 })
  }

  const obj = event.data?.object ?? {}

  switch (event.type) {
    // サブスクリプション更新成功
    case "subscription.renewed": {
      const subscriptionId = obj.id as string
      const periodEnd = obj.current_period_end as number | undefined
      if (subscriptionId && periodEnd) {
        await prisma.billing.updateMany({
          where: { payjpSubscriptionId: subscriptionId },
          data: {
            status: "active",
            currentPeriodEnd: new Date(periodEnd * 1000),
          },
        })
      }
      break
    }

    // サブスクリプション解約完了
    case "subscription.canceled": {
      const subscriptionId = obj.id as string
      if (subscriptionId) {
        await prisma.billing.updateMany({
          where: { payjpSubscriptionId: subscriptionId },
          data: {
            status: "canceled",
            plan: "free",
          },
        })
      }
      break
    }

    // 支払い失敗
    case "charge.failed": {
      const customerId = obj.customer as string | undefined
      if (customerId) {
        await prisma.billing.updateMany({
          where: { payjpCustomerId: customerId },
          data: { status: "past_due" },
        })
      }
      break
    }

    // 支払い成功（past_due からの復帰）
    case "charge.succeeded": {
      const customerId = obj.customer as string | undefined
      if (customerId) {
        await prisma.billing.updateMany({
          where: { payjpCustomerId: customerId, status: "past_due" },
          data: { status: "active" },
        })
      }
      break
    }

    default:
      // 未処理のイベントは無視して 200 を返す
      break
  }

  return NextResponse.json({ received: true })
}
