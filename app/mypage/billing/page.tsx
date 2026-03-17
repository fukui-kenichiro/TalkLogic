"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  XCircle,
} from "lucide-react"

declare global {
  interface Window {
    Payjp: (key: string) => PayjpInstance
  }
}

type PayjpInstance = {
  elements: () => PayjpElements
  createToken: (element: PayjpElement) => Promise<{ id?: string; error?: { message: string } }>
}

type PayjpElements = {
  create: (type: string, options?: object) => PayjpElement
}

type PayjpElement = {
  mount: (selector: string) => void
  unmount: () => void
}

type BillingInfo = {
  plan: string
  status: string
  currentPeriodEnd: string | null
  payjpSubscriptionId: string | null
}

const ELEMENT_STYLE = {
  base: {
    color: "#1a1a2e",
    fontFamily: '"Hiragino Kaku Gothic ProN", Meiryo, sans-serif',
    fontSize: "15px",
    "::placeholder": { color: "#a0aec0" },
  },
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const payjpRef = useRef<PayjpInstance | null>(null)
  const cardNumberElRef = useRef<PayjpElement | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    fetchBilling()
  }, [])

  // PAY.JP Elements をマウント（スクリプト読込 & 無料プランのときだけ）
  useEffect(() => {
    if (!scriptLoaded || !billing || billing.plan !== "free" || mountedRef.current) return

    const payjp = window.Payjp(process.env.NEXT_PUBLIC_PAYJP_PUBLIC_KEY ?? "")
    payjpRef.current = payjp
    const elements = payjp.elements()

    const cnEl = elements.create("cardNumber", { style: ELEMENT_STYLE, placeholder: "1234 5678 9012 3456" })
    const ceEl = elements.create("cardExpiry", { style: ELEMENT_STYLE, placeholder: "MM / YY" })
    const ccEl = elements.create("cardCvc", { style: ELEMENT_STYLE, placeholder: "CVC" })

    cnEl.mount("#payjp-card-number")
    ceEl.mount("#payjp-card-expiry")
    ccEl.mount("#payjp-card-cvc")

    cardNumberElRef.current = cnEl
    mountedRef.current = true

    return () => {
      cnEl.unmount()
      ceEl.unmount()
      ccEl.unmount()
      mountedRef.current = false
    }
  }, [scriptLoaded, billing])

  const fetchBilling = async () => {
    try {
      const res = await fetch("/api/billing/status")
      if (res.ok) setBilling(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!payjpRef.current || !cardNumberElRef.current) return
    setSubscribing(true)
    setError("")

    const { id, error: tokenError } = await payjpRef.current.createToken(
      cardNumberElRef.current
    )
    if (tokenError || !id) {
      setError(tokenError?.message ?? "カード情報の取得に失敗しました")
      setSubscribing(false)
      return
    }

    const res = await fetch("/api/billing/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: id }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "登録に失敗しました")
      setSubscribing(false)
      return
    }

    setSuccess("スタンダードプランへの加入が完了しました！")
    mountedRef.current = false
    fetchBilling()
    setSubscribing(false)
  }

  const handleCancel = async () => {
    if (!confirm("解約すると、現在の請求期間終了後にサービスが停止します。解約しますか？")) return
    setCanceling(true)
    setError("")

    const res = await fetch("/api/billing/cancel", { method: "POST" })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "解約処理に失敗しました")
      setCanceling(false)
      return
    }

    setSuccess("解約手続きが完了しました。現在の期間終了後に無料プランへ移行します。")
    fetchBilling()
    setCanceling(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  const isPaid = billing?.plan === "standard"
  const isCanceled = billing?.status === "canceled"
  const isPastDue = billing?.status === "past_due"

  return (
    <>
      <Script
        src="https://js.pay.jp/v2/pay.js"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/mypage">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">プラン・課金管理</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              サブスクリプションの登録・解約ができます
            </p>
          </div>
        </div>

        {/* フィードバック */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{success}</p>
          </div>
        )}

        {/* 現在のプラン */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              現在のプラン
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPaid ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="font-semibold">スタンダードプラン</span>
                  <span className="text-sm text-muted-foreground">月額500円</span>
                </div>
                {isCanceled ? (
                  <p className="text-sm text-yellow-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    解約済み —{" "}
                    {billing?.currentPeriodEnd &&
                      new Date(billing.currentPeriodEnd).toLocaleDateString("ja-JP")}
                    まで利用可能
                  </p>
                ) : isPastDue ? (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    お支払いに問題が発生しています。カード情報をご確認ください。
                  </p>
                ) : (
                  billing?.currentPeriodEnd && (
                    <p className="text-sm text-muted-foreground">
                      次回更新日:{" "}
                      {new Date(billing.currentPeriodEnd).toLocaleDateString("ja-JP")}
                    </p>
                  )
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-5 w-5" />
                <span>無料プラン</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 加入フォーム（無料プランのみ表示） */}
        {!isPaid && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">スタンダードプランに加入する</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="bg-blue-50 rounded-lg p-4 text-sm space-y-1">
                <p className="font-semibold text-blue-800">月額 500円（税込）</p>
                <p className="text-blue-700">毎月自動更新・いつでも解約可能</p>
              </div>

              {/* PAY.JP Elements */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    カード番号
                  </label>
                  <div
                    id="payjp-card-number"
                    className="border rounded-md px-3 py-2.5 bg-white min-h-[42px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      有効期限
                    </label>
                    <div
                      id="payjp-card-expiry"
                      className="border rounded-md px-3 py-2.5 bg-white min-h-[42px]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      セキュリティコード
                    </label>
                    <div
                      id="payjp-card-cvc"
                      className="border rounded-md px-3 py-2.5 bg-white min-h-[42px]"
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                カード情報はPAY.JPの安全な環境で処理されます。当サービスのサーバーにカード番号は保存されません。
              </p>

              <Button
                className="w-full"
                onClick={handleSubscribe}
                disabled={subscribing || !scriptLoaded}
              >
                {subscribing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    処理中...
                  </>
                ) : (
                  "月額500円のプランに加入する"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 解約（有効中のみ表示） */}
        {isPaid && !isCanceled && (
          <Card className="border-red-100">
            <CardHeader>
              <CardTitle className="text-base text-red-700">解約する</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                解約すると、現在の請求期間終了後に無料プランへ移行します。
                期間終了まではサービスをご利用いただけます。
              </p>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={handleCancel}
                disabled={canceling}
              >
                {canceling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    処理中...
                  </>
                ) : (
                  "プランを解約する"
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
