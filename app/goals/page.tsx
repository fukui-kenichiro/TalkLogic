"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    outcomeName: "",
    colorCode: "#3b82f6",
  })

  const [dialogueLabel, setDialogueLabel] = useState("対話人数")
  const [dialogueLabelEditing, setDialogueLabelEditing] = useState(false)
  const [dialogueLabelSaving, setDialogueLabelSaving] = useState(false)
  const [dialogueLabelError, setDialogueLabelError] = useState("")

  useEffect(() => {
    fetchGoals()
    fetch("/api/settings/dialogue-label")
      .then((r) => r.json())
      .then((d) => setDialogueLabel(d.label ?? "対話人数"))
      .catch(() => null)
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
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "保存に失敗しました")
        setSaving(false)
        return
      }

      setFormData({
        goalName: "",
        outcomeName: "",
        colorCode: "#3b82f6",
      })
      setShowForm(false)
      fetchGoals()
    } catch (err) {
      setError("保存処理中にエラーが発生しました")
    } finally {
      setSaving(false)
    }
  }

  const handleDialogueLabelSave = async () => {
    if (!dialogueLabel.trim()) {
      setDialogueLabelError("ラベル名を入力してください")
      return
    }
    setDialogueLabelSaving(true)
    setDialogueLabelError("")
    try {
      const res = await fetch("/api/settings/dialogue-label", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: dialogueLabel.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setDialogueLabelError(data.error || "保存に失敗しました")
        return
      }
      setDialogueLabelEditing(false)
    } catch {
      setDialogueLabelError("保存処理中にエラーが発生しました")
    } finally {
      setDialogueLabelSaving(false)
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

      {/* Dialogue Count Label Setting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">活動量カウント名</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            「新規活動記録」の必須項目（デフォルト: 対話人数）の名前を変更できます。
          </p>
          {dialogueLabelEditing ? (
            <div className="space-y-2">
              {dialogueLabelError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
                  {dialogueLabelError}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={dialogueLabel}
                  onChange={(e) => setDialogueLabel(e.target.value)}
                  maxLength={20}
                  placeholder="例: 用意したチラシ枚数"
                  className="flex-1"
                />
                <Button onClick={handleDialogueLabelSave} disabled={dialogueLabelSaving}>
                  {dialogueLabelSaving ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" />保存中...</>
                  ) : "保存"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogueLabelEditing(false)
                    setDialogueLabelError("")
                  }}
                  disabled={dialogueLabelSaving}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="font-semibold text-lg">{dialogueLabel}</span>
              <Button variant="outline" size="sm" onClick={() => setDialogueLabelEditing(true)}>
                変更
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
                <Label htmlFor="outcomeName">成果名 *</Label>
                <Input
                  id="outcomeName"
                  required
                  placeholder="例: 加盟数"
                  value={formData.outcomeName}
                  onChange={(e) =>
                    setFormData({ ...formData, outcomeName: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  実績として記録する項目名
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
                    <p className="text-sm text-muted-foreground">{goal.goalName}</p>
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
            <li>• 活動の目的に合わせて自由に指標を定義できます</li>
            <li>• 政治活動: 加入数、資料配布数、署名数など</li>
            <li>• 営業活動: 契約数、アポ獲得数、名刺交換数など</li>
            <li>• NPO活動: 会員獲得数、寄付者数、参加者数など</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
