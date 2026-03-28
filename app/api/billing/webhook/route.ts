import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import prisma from "@/lib/prisma"

// Square Webhook 署名検証
// Square uses HMAC-SHA256 with the webhook signature key
function verifySignature(
  rawBody: string,
  signature: string,
  secret: string,
  url: string
): boolean {
  // Square signature: HMAC-SHA256( webhookSignatureKey, url + body )
  const hmac = createHmac("sha256", secret)
    .update(url + rawBody)
    .digest("base64")
  try {
    return timingSafeEqual(Buffer.from(hmac), Buffer.from(signature))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get("x-square-hmacsha256-signature") ?? ""
  const webhookSecret = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ?? ""
  const webhookUrl = process.env.SQUARE_WEBHOOK_URL ?? req.url

  if (webhookSecret && !verifySignature(rawBody, signature, webhookSecret, webhookUrl)) {
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
    // 支払い完了（Payment Link 経由での決済確認バックアップ）
    case "payment.completed": {
      const orderId = (obj as { payment?: { order_id?: string } }).payment?.order_id
      if (orderId) {
        const billing = await prisma.billing.findFirst({
          where: { squareOrderId: orderId },
        })
        if (billing && billing.plan !== "standard") {
          const periodEnd = new Date()
          periodEnd.setMonth(periodEnd.getMonth() + 1)
          await prisma.billing.update({
            where: { id: billing.id },
            data: {
              plan: "standard",
              status: "active",
              squareSessionId: null,
              currentPeriodEnd: periodEnd,
            },
          })
        }
      }
      break
    }

    default:
      // 未処理のイベントは無視して 200 を返す
      break
  }

  return NextResponse.json({ received: true })
}
