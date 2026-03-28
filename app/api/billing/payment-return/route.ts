import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getPayment, getPaymentsByOrderId, getOrder } from "@/lib/square"

const MAX_RETRY = 4
const PLAN_AMOUNT_JPY = 500

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const sessionId = searchParams.get("session") ?? ""
  // Square がリダイレクト URL に付与するパラメータ（付かない場合もある）
  const transactionId = searchParams.get("transactionId") ?? ""
  const retry = parseInt(searchParams.get("retry") ?? "0", 10)

  if (!sessionId) {
    return html(errorHtml("セッション情報が見つかりません"))
  }

  const billing = await prisma.billing.findFirst({
    where: { squareSessionId: sessionId },
  })

  if (!billing) {
    return html(errorHtml("セッション情報が見つかりません"))
  }

  // 既に処理済み（冪等性）
  if (billing.plan === "standard" && billing.status === "active" && !billing.squareSessionId) {
    return new NextResponse(successHtml(origin), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  }

  let isPaid = false

  // ── 確認方法1: URL の transactionId で Payment を直接確認 ──────────────
  if (transactionId) {
    const res = await getPayment(transactionId)
    const p = res.payment
    console.log("[payment-return] method1 payment:", JSON.stringify(p))
    if (
      p &&
      (p.status === "COMPLETED" || p.status === "APPROVED") &&
      (p.amount_money?.amount ?? 0) >= PLAN_AMOUNT_JPY
    ) {
      isPaid = true
    }
  }

  // ── 確認方法2: order_id で Payment 一覧を検索（最確実） ─────────────────
  if (!isPaid && billing.squareOrderId) {
    const res = await getPaymentsByOrderId(billing.squareOrderId)
    console.log("[payment-return] method2 payments:", JSON.stringify(res.payments))
    const payments: Array<{ status: string; amount_money?: { amount?: number } }> =
      res.payments ?? []
    isPaid = payments.some(
      (p) =>
        (p.status === "COMPLETED" || p.status === "APPROVED") &&
        (p.amount_money?.amount ?? 0) >= PLAN_AMOUNT_JPY
    )
  }

  // ── 確認方法3: Order の tenders で確認（フォールバック） ──────────────────
  if (!isPaid && billing.squareOrderId) {
    const res = await getOrder(billing.squareOrderId)
    const order = res.order
    console.log("[payment-return] method3 order state:", order?.state, "tenders:", JSON.stringify(order?.tenders))
    // order.state は Payment Link では OPEN のままが正常なので確認しない
    if (Array.isArray(order?.tenders)) {
      for (const tender of order.tenders as Array<Record<string, unknown>>) {
        const cardStatus =
          (tender.card_details as Record<string, string> | undefined)?.status
        const tenderAmount =
          (tender.amount_money as { amount?: number } | undefined)?.amount ?? 0
        if (
          (cardStatus === "CAPTURED" || cardStatus === "AUTHORIZED") &&
          tenderAmount >= PLAN_AMOUNT_JPY
        ) {
          isPaid = true
          break
        }
      }
    }
  }

  if (!isPaid) {
    if (retry < MAX_RETRY) {
      const nextUrl = new URL(req.url)
      nextUrl.searchParams.set("retry", String(retry + 1))
      return new NextResponse(loadingHtml(), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          Refresh: `5; URL=${nextUrl.toString()}`,
        },
      })
    }
    return html(
      errorHtml(
        "決済の確認ができませんでした。お支払いが完了している場合は、しばらく待ってからマイページを確認してください。"
      )
    )
  }

  // ── DB 更新（未処理の場合のみ） ──────────────────────────────────────────
  if (billing.plan !== "standard" || billing.status !== "active") {
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

  return new NextResponse(successHtml(origin), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

function html(body: string) {
  return new NextResponse(body, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

function successHtml(origin: string) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>決済完了</title>
  <style>
    body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f0fdf4}
    .card{background:#fff;border-radius:12px;padding:32px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.08);max-width:320px}
    .icon{font-size:48px;margin-bottom:16px}
    h1{font-size:20px;margin:0 0 8px;color:#166534}
    p{color:#4b5563;font-size:14px;margin:0}
  </style>
</head>
<body data-status="success">
  <div class="card">
    <div class="icon">✅</div>
    <h1>決済が完了しました</h1>
    <p>スタンダードプランへの加入が完了しました。このウィンドウは自動的に閉じます。</p>
  </div>
  <script>
    (function(){
      if(window.opener&&!window.opener.closed){
        try{window.opener.postMessage({type:'talklogic_payment',status:'success'},'${origin}')}catch(e){}
      }
      setTimeout(function(){window.close()},2000)
    })()
  </script>
</body>
</html>`
}

function loadingHtml() {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>決済確認中</title>
  <style>
    body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#eff6ff}
    .card{background:#fff;border-radius:12px;padding:32px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.08);max-width:320px}
    .spinner{width:48px;height:48px;border:4px solid #dbeafe;border-top-color:#3b82f6;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px}
    @keyframes spin{to{transform:rotate(360deg)}}
    h1{font-size:18px;margin:0 0 8px;color:#1e3a8a}
    p{color:#4b5563;font-size:13px;margin:0}
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h1>決済を確認しています...</h1>
    <p>このページを閉じないでください。<br>自動的に更新されます。</p>
  </div>
</body>
</html>`
}

function errorHtml(message: string) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>エラー</title>
  <style>
    body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fef2f2}
    .card{background:#fff;border-radius:12px;padding:32px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.08);max-width:320px}
    .icon{font-size:48px;margin-bottom:16px}
    h1{font-size:18px;margin:0 0 8px;color:#991b1b}
    p{color:#4b5563;font-size:13px;margin:0 0 16px}
    a{color:#2563eb}
  </style>
</head>
<body data-status="error">
  <div class="card">
    <div class="icon">❌</div>
    <h1>エラーが発生しました</h1>
    <p>${message}</p>
    <p><a href="javascript:window.close()">このウィンドウを閉じる</a></p>
  </div>
</body>
</html>`
}
