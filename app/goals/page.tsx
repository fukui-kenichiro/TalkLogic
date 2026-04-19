"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Loader2 } from "lucide-react"
import type { Goal } from "@prisma/client"

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    goalName: "",
    activityCountLabel: "",
    outcomeName: "",
    colorCode: "#3b82f6",
    monthlyTarget: "",
    annualTarget: "",
    qualitativeTarget: "",
  })

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/goals")
      if (res.ok) {
        const data = await res.json()
        setGoals(data)
      }
    } catch (error) {
      console.error("Failed to fetch goals:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const payload = {
        ...formData,
        monthlyTarget: formData.monthlyTarget !== "" ? parseInt(formData.monthlyTarget, 10) : null,
        annualTarget: formData.annualTarget !== "" ? parseInt(formData.annualTarget, 10) : null,
        qualitativeTarget: formData.qualitativeTarget.trim() !== "" ? formData.qualitativeTarget.trim() : null,
      }

      const res = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "保存に失敗しました")
        setSaving(false)
        return
      }

      setFormData({
        goalName: "",
        activityCountLabel: "",
        outcomeName: "",
        colorCode: "#3b82f6",
        monthlyTarget: "",
        annualTarget: "",
        qualitativeTarget: "",
      })
      setShowForm(false)
      fetchGoals()
    } catch (err) {
      setError("保存処理中にエラーが発生しました")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("この成果指標を削除してもよろしいですか？")) {
      return
    }

    try {
      const res = await fetch(`/api/goals/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchGoals()
      }
    } catch (error) {
      console.error("Failed to delete goal:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">成果指標設定</h1>
          <p className="text-muted-foreground mt-1">
            活動の目的に合わせて成果指標をカスタマイズできます
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            新規追加
          </Button>
        )}
      </div>

      {/* Add Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>新しい成果指標</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="goalName">目的名 *</Label>
                <Input
                  id="goalName"
                  required
                  placeholder="例: 同盟員拡大"
                  value={formData.goalName}
                  onChange={(e) =>
                    setFormData({ ...formData, goalName: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  活動の目的や種類を表す名前
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityCountLabel">活動量の名前 *</Label>
                <Input
                  id="activityCountLabel"
                  required
                  placeholder="例: 対話人数、用意したチラシ枚数"
                  maxLength={20}
                  value={formData.activityCountLabel}
                  onChange={(e) =>
                    setFormData({ ...formData, activityCountLabel: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  活動量として記録する項目名（例: 対話人数、サンプリング数）
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outcomeName">成果名 *</Label>
                <Input
                  id="outcomeName"
                  required
                  placeholder="例: 加盟数、配布数"
                  value={formData.outcomeName}
                  onChange={(e) =>
                    setFormData({ ...formData, outcomeName: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  実績として記録する項目名
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyTarget">月次目標（任意）</Label>
                  <Input
                    id="monthlyTarget"
                    type="number"
                    min={1}
                    placeholder="例: 10"
                    value={formData.monthlyTarget}
                    onChange={(e) =>
                      setFormData({ ...formData, monthlyTarget: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    1ヶ月あたりの目標数値
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annualTarget">年間累計目標（任意）</Label>
                  <Input
                    id="annualTarget"
                    type="number"
                    min={1}
                    placeholder="例: 120"
                    value={formData.annualTarget}
                    onChange={(e) =>
                      setFormData({ ...formData, annualTarget: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    年間累計の目標数値
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qualitativeTarget">定性目標（任意）</Label>
                <Textarea
                  id="qualitativeTarget"
                  placeholder="例: 新エリアへの展開と対話の質向上。初回接触から関係構築まで丁寧にフォローする。"
                  rows={3}
                  maxLength={500}
                  value={formData.qualitativeTarget}
                  onChange={(e) =>
                    setFormData({ ...formData, qualitativeTarget: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  数値では表せない目標や方針（月次レポートのAI分析に反映されます）
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="colorCode">カラーコード</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="colorCode"
                    type="color"
                    className="w-20 h-10"
                    value={formData.colorCode}
                    onChange={(e) =>
                      setFormData({ ...formData, colorCode: e.target.value })
                    }
                  />
                  <Input
                    type="text"
                    className="flex-1"
                    value={formData.colorCode}
                    onChange={(e) =>
                      setFormData({ ...formData, colorCode: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "保存する"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-lg font-medium mb-2">成果指標がまだありません</p>
            <p className="text-muted-foreground mb-6">
              最初の成果指標を追加して、活動の成果を記録しましょう
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              成果指標を追加
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: goal.colorCode }}
                  />
                  <div>
                    <p className="font-semibold text-lg">{goal.outcomeName}</p>
                    <p className="text-sm text-muted-foreground">
                      {goal.goalName}
                      <span className="mx-1">·</span>
                      活動量: {goal.activityCountLabel}
                    </p>
                    {(goal.monthlyTarget != null || goal.annualTarget != null) && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {goal.monthlyTarget != null && (
                          <span>月次目標: {goal.monthlyTarget.toLocaleString()}</span>
                        )}
                        {goal.monthlyTarget != null && goal.annualTarget != null && (
                          <span className="mx-1">·</span>
                        )}
                        {goal.annualTarget != null && (
                          <span>年間累計目標: {goal.annualTarget.toLocaleString()}</span>
                        )}
                      </p>
                    )}
                    {goal.qualitativeTarget && (
                      <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">
                        定性目標: {goal.qualitativeTarget}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(goal.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">💡 成果指標について</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• 活動量と成果をセットで定義できます</li>
            <li>• 例: 活動量「対話人数」→ 成果「加盟数」</li>
            <li>• 例: 活動量「用意したチラシ枚数」→ 成果「配布数」</li>
            <li>• 例: 活動量「サンプリング数」→ 成果「アポ獲得数」</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
