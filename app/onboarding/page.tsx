"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Loader2,
  BarChart2,
  ClipboardList,
  LineChart,
} from "lucide-react"

// ========== 型定義 ==========
type UseCaseKey = "political" | "sales" | "npo" | "other"

interface GoalItem {
  goalName: string
  outcomeName: string
  colorCode: string
  enabled: boolean
}

// ========== デフォルト指標 ==========
const PRESET_GOALS: Record<UseCaseKey, GoalItem[]> = {
  political: [
    { goalName: "同盟員拡大", outcomeName: "加盟数", colorCode: "#3b82f6", enabled: true },
    { goalName: "政治資料配布", outcomeName: "配布数", colorCode: "#10b981", enabled: true },
    { goalName: "署名活動", outcomeName: "署名数", colorCode: "#f59e0b", enabled: false },
  ],
  sales: [
    { goalName: "商談成立", outcomeName: "契約数", colorCode: "#3b82f6", enabled: true },
    { goalName: "アポ獲得", outcomeName: "アポ数", colorCode: "#10b981", enabled: true },
    { goalName: "名刺交換", outcomeName: "名刺数", colorCode: "#f59e0b", enabled: false },
  ],
  npo: [
    { goalName: "会員獲得", outcomeName: "会員数", colorCode: "#3b82f6", enabled: true },
    { goalName: "寄付獲得", outcomeName: "寄付者数", colorCode: "#10b981", enabled: true },
    { goalName: "参加勧誘", outcomeName: "参加者数", colorCode: "#f59e0b", enabled: false },
  ],
  other: [],
}

const USE_CASES: { key: UseCaseKey; label: string; description: string; emoji: string }[] = [
  { key: "political", label: "政治活動", description: "街頭演説・ビラ配布・署名活動など", emoji: "🏛️" },
  { key: "sales", label: "営業活動", description: "商談・アポ獲得・名刺交換など", emoji: "💼" },
  { key: "npo", label: "NPO・ボランティア", description: "会員獲得・募金・イベント参加勧誘など", emoji: "🤝" },
  { key: "other", label: "その他", description: "自由に成果指標を設定する", emoji: "✏️" },
]

const FEATURE_SLIDES = [
  {
    icon: ClipboardList,
    title: "活動を記録する",
    description:
      "場所・日時・対話人数・成果をかんたんに記録。活動履歴をいつでも振り返れます。",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: BarChart2,
    title: "ダッシュボードで確認",
    description:
      "今月の活動回数・対話人数・成果指標を一目で把握。前月比も自動で計算されます。",
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    icon: LineChart,
    title: "AIレポートで分析",
    description:
      "月次レポートをAIが自動分析。活動の傾向や改善ポイントをわかりやすく提案します。",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
]

const TOTAL_STEPS = 5

// ========== ステップバー ==========
function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 justify-center mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i < current
              ? "bg-primary w-6"
              : i === current
              ? "bg-primary w-10"
              : "bg-gray-200 w-6"
          }`}
        />
      ))}
    </div>
  )
}

// ========== メインページ ==========
export default function OnboardingPage() {
  const router = useRouter()
  const { update: updateSession } = useSession()

  const [step, setStep] = useState(0)
  const [useCase, setUseCase] = useState<UseCaseKey | null>(null)
  const [goals, setGoals] = useState<GoalItem[]>([])
  const [featureSlide, setFeatureSlide] = useState(0)
  const [saving, setSaving] = useState(false)
  const [newGoal, setNewGoal] = useState({ goalName: "", outcomeName: "", colorCode: "#3b82f6" })
  const [showNewGoalForm, setShowNewGoalForm] = useState(false)

  // 用途選択後に指標をプリセット
  const handleSelectUseCase = (key: UseCaseKey) => {
    setUseCase(key)
    setGoals(PRESET_GOALS[key].map((g) => ({ ...g })))
    setShowNewGoalForm(false)
  }

  const toggleGoal = (i: number) => {
    setGoals((prev) =>
      prev.map((g, idx) => (idx === i ? { ...g, enabled: !g.enabled } : g))
    )
  }

  const removeCustomGoal = (i: number) => {
    setGoals((prev) => prev.filter((_, idx) => idx !== i))
  }

  const addCustomGoal = () => {
    if (!newGoal.goalName || !newGoal.outcomeName) return
    setGoals((prev) => [...prev, { ...newGoal, enabled: true }])
    setNewGoal({ goalName: "", outcomeName: "", colorCode: "#3b82f6" })
    setShowNewGoalForm(false)
  }

  const handleComplete = async () => {
    setSaving(true)
    try {
      const selectedGoals = goals.filter((g) => g.enabled)
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: selectedGoals }),
      })
      if (!res.ok) throw new Error("Failed")
      // JWTトークンのonboardingCompletedを更新
      await updateSession({ onboardingCompleted: true })
      setStep(4)
    } catch {
      alert("エラーが発生しました。もう一度お試しください。")
    } finally {
      setSaving(false)
    }
  }

  // ========== Step 0: ようこそ ==========
  if (step === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-lg text-center">
          <StepBar current={0} />
          <div className="text-6xl mb-6">👋</div>
          <h1 className="text-3xl font-bold mb-3">TalkLogicへようこそ！</h1>
          <p className="text-muted-foreground text-lg mb-2">
            街頭対話活動を記録し、AIで分析・改善するツールです。
          </p>
          <p className="text-muted-foreground mb-10">
            かんたんな初期設定を行いましょう。2〜3分で完了します。
          </p>
          <Button size="lg" className="w-full max-w-xs" onClick={() => setStep(1)}>
            はじめる
          </Button>
        </div>
      </div>
    )
  }

  // ========== Step 1: 用途選択 ==========
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-lg">
          <StepBar current={1} />
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">活動の用途を選んでください</h2>
            <p className="text-muted-foreground">
              用途に合った成果指標を自動で提案します
            </p>
          </div>
          <div className="grid gap-3">
            {USE_CASES.map((uc) => (
              <button
                key={uc.key}
                onClick={() => handleSelectUseCase(uc.key)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  useCase === uc.key
                    ? "border-primary bg-white shadow-md"
                    : "border-transparent bg-white hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{uc.emoji}</span>
                  <div>
                    <p className="font-semibold">{uc.label}</p>
                    <p className="text-sm text-muted-foreground">{uc.description}</p>
                  </div>
                  <div className="ml-auto">
                    {useCase === uc.key ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-8">
            <Button variant="ghost" onClick={() => setStep(0)}>
              戻る
            </Button>
            <Button onClick={() => setStep(2)} disabled={!useCase}>
              次へ
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ========== Step 2: 成果指標設定 ==========
  if (step === 2) {
    const isOther = useCase === "other"
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-lg">
          <StepBar current={2} />
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">成果指標を設定しましょう</h2>
            <p className="text-muted-foreground text-sm">
              {isOther
                ? "記録したい成果指標を追加してください"
                : "提案された指標から使用するものを選んでください。後から変更できます。"}
            </p>
          </div>

          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
            {goals.map((g, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border"
              >
                <button
                  onClick={() => toggleGoal(i)}
                  className="flex-shrink-0"
                  type="button"
                >
                  {g.enabled ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300" />
                  )}
                </button>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: g.colorCode }}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{g.outcomeName}</p>
                  <p className="text-xs text-muted-foreground truncate">{g.goalName}</p>
                </div>
                {isOther && (
                  <button
                    onClick={() => removeCustomGoal(i)}
                    type="button"
                    className="text-red-400 hover:text-red-600 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            {goals.length === 0 && !showNewGoalForm && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                指標がありません。追加してください。
              </div>
            )}
          </div>

          {/* 追加フォーム */}
          {showNewGoalForm ? (
            <Card className="mb-3">
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">目的名</Label>
                  <Input
                    placeholder="例: 同盟員拡大"
                    value={newGoal.goalName}
                    onChange={(e) => setNewGoal({ ...newGoal, goalName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">成果名</Label>
                  <Input
                    placeholder="例: 加盟数"
                    value={newGoal.outcomeName}
                    onChange={(e) => setNewGoal({ ...newGoal, outcomeName: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">カラー</Label>
                  <input
                    type="color"
                    className="w-8 h-8 rounded border cursor-pointer"
                    value={newGoal.colorCode}
                    onChange={(e) => setNewGoal({ ...newGoal, colorCode: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addCustomGoal} disabled={!newGoal.goalName || !newGoal.outcomeName}>
                    追加
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowNewGoalForm(false)}>
                    キャンセル
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewGoalForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-primary border border-dashed border-primary/40 rounded-lg hover:bg-primary/5 mb-3"
            >
              <Plus className="h-4 w-4" />
              指標を追加
            </button>
          )}

          <p className="text-xs text-muted-foreground text-center mb-6">
            指標は後から「成果指標設定」ページでいつでも変更できます
          </p>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              戻る
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)}>
                スキップ
              </Button>
              <Button onClick={() => setStep(3)}>
                次へ
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ========== Step 3: 機能ガイド ==========
  if (step === 3) {
    const slide = FEATURE_SLIDES[featureSlide]
    const Icon = slide.icon
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-lg">
          <StepBar current={3} />
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-1">主な機能のご紹介</h2>
            <p className="text-muted-foreground text-sm">
              {featureSlide + 1} / {FEATURE_SLIDES.length}
            </p>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-8 pb-8 text-center">
              <div className={`inline-flex p-5 rounded-full ${slide.bg} mb-5`}>
                <Icon className={`h-10 w-10 ${slide.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-3">{slide.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{slide.description}</p>
            </CardContent>
          </Card>

          {/* スライドドット */}
          <div className="flex justify-center gap-2 mb-8">
            {FEATURE_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setFeatureSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === featureSlide ? "bg-primary w-5" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={() =>
                featureSlide > 0 ? setFeatureSlide(featureSlide - 1) : setStep(2)
              }
            >
              戻る
            </Button>
            {featureSlide < FEATURE_SLIDES.length - 1 ? (
              <Button onClick={() => setFeatureSlide(featureSlide + 1)}>
                次へ
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    設定中...
                  </>
                ) : (
                  "設定を完了する"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ========== Step 4: 完了 ==========
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-lg text-center">
        <StepBar current={4} />
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-3xl font-bold mb-3">準備完了です！</h2>
        <p className="text-muted-foreground mb-10">
          さっそく最初の活動を記録してみましょう。
        </p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Button
            size="lg"
            onClick={() => router.push("/activities/new")}
          >
            最初の活動を記録する
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            ダッシュボードへ
          </Button>
        </div>
      </div>
    </div>
  )
}
