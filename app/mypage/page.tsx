"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserCircle, CreditCard, Mail, User, ChevronRight } from "lucide-react"

type AccountInfo = {
  username: string
  email: string
  nickname: string | null
  createdAt: string
  billing: {
    plan: string
    status: string
    currentPeriodEnd: string | null
  } | null
}

const PLAN_LABEL: Record<string, string> = {
  free: "無料プラン",
  standard: "スタンダードプラン（月額500円）",
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active: { label: "有効", color: "text-green-600" },
  canceled: { label: "解約済み（期間終了まで利用可）", color: "text-yellow-600" },
  past_due: { label: "支払い未完了", color: "text-red-600" },
  trialing: { label: "トライアル中", color: "text-blue-600" },
}

export default function MypagePage() {
  const [account, setAccount] = useState<AccountInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/mypage/account")
      .then((r) => r.json())
      .then(setAccount)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!account) return null

  const billing = account.billing
  const statusInfo = billing ? STATUS_LABEL[billing.status] : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">マイページ</h1>
        <p className="text-muted-foreground mt-1">アカウント情報と課金管理</p>
      </div>

      {/* アカウント情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCircle className="h-5 w-5" />
            アカウント情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow icon={<User className="h-4 w-4" />} label="ユーザー名" value={account.username} />
          <InfoRow icon={<User className="h-4 w-4" />} label="表示名" value={account.nickname ?? account.username} />
          <InfoRow icon={<Mail className="h-4 w-4" />} label="メールアドレス" value={account.email} />
          <InfoRow
            icon={<User className="h-4 w-4" />}
            label="登録日"
            value={new Date(account.createdAt).toLocaleDateString("ja-JP")}
          />
        </CardContent>
      </Card>

      {/* 課金情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5" />
            プラン・課金
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">現在のプラン</p>
              <p className="font-semibold">
                {billing ? PLAN_LABEL[billing.plan] ?? billing.plan : "無料プラン"}
              </p>
              {statusInfo && (
                <p className={`text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </p>
              )}
              {billing?.currentPeriodEnd && billing.plan !== "free" && (
                <p className="text-xs text-muted-foreground">
                  次回更新日:{" "}
                  {new Date(billing.currentPeriodEnd).toLocaleDateString("ja-JP")}
                </p>
              )}
            </div>
            <Link href="/mypage/billing">
              <Button variant="outline" size="sm" className="gap-1">
                管理する
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between py-1 border-b last:border-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}
