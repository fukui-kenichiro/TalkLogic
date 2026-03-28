"use client"

import { useEffect, useState } from "react"
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

type BillingInfo = {
  plan: string
  status: string
  currentPeriodEnd: string | null
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchBilling()
  }, [])

  const fetchBilling = async () => {
    try {
      const res = await fetch("/api/billing/status")
      if (res.ok) setBilling(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = () => {
    setError("")

    // ポップアップはクリックハンドラー（同期）内で開く（ポップアップブロッカー対策）
    const popup = openPaymentPopup("about:blank")

    setSubscribing(true)

    // postMessage リスナーを登録
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== location.origin) return
      if (!event.data || event.data.type !== "talklogic_payment") return
      window.removeEventListener("message", onMessage)
      setSubscribing(false)
      if (event.data.status === "success") {
        setSuccess("スタンダードプランへの加入が完了しました！")
        fetchBilling()
      } else {
        setError("決済処理に失敗しました。もう一度お試しください。")
      }
    }
    window.addEventListener("message", onMessage)

    // バックエンドで Square Payment Link を作成
    fetch("/api/billing/subscribe", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          popup?.close()
          window.removeEventListener("message", onMessage)
          setError(data.error)
          setSubscribing(false)
          return
        }
        // ポップアップを Square チェックアウトへ遷移
        if (popup && !popup.closed) {
          popup.location.href = data.checkout_url
        } else {
          // ポップアップブロック時のフォールバック
          window.location.href = data.checkout_url
        }
      })
      .catch(() => {
        popup?.close()
        window.removeEventListener("message", onMessage)
        setError("通信エラーが発生しました。もう一度お試しください。")
        setSubscribing(false)
      })
  }

  const handleCancel = async () => {
    if (
      !confirm(
        "解約すると、現在の請求期間終了後にサービスが停止します。解約しますか？"
      )
    )
      return
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
                  お支払いに問題が発生しています。サポートにお問い合わせください。
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

            <p className="text-xs text-muted-foreground">
              「加入する」ボタンを押すと Square の安全な決済画面が別ウィンドウで開きます。
              カード情報は当サービスのサーバーには保存されません。
            </p>

            <Button
              className="w-full"
              onClick={handleSubscribe}
              disabled={subscribing}
            >
              {subscribing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  決済画面を開いています...
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
  )
}

function openPaymentPopup(url: string) {
  const w = 500
  const h = Math.floor(window.innerHeight * 0.75)
  const left =
    Math.floor((window.innerWidth - w) / 2) + (window.screenLeft ?? 0)
  const top =
    Math.floor((window.innerHeight - h) / 2) + (window.screenTop ?? 0)
  const win = window.open(
    url,
    "Square Payment",
    `scrollbars=yes,width=${w},height=${h},top=${top},left=${left}`
  )
  if (win) win.focus()
  return win
}
