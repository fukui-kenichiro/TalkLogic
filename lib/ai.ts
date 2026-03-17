import Anthropic from "@anthropic-ai/sdk"

// ===== プラン制限 =====
export const FREE_ACTIVITY_LIMIT = 10
export const FREE_AI_LIMIT = 10

// ===== モデル定義 =====
export const AI_MODELS = {
  "claude-haiku": {
    label: "Claude Haiku（高速）",
    provider: "anthropic" as const,
    modelId: "claude-haiku-4-5-20251001",
    paidOnly: false,
  },
  "claude-sonnet": {
    label: "Claude Sonnet（高精度）",
    provider: "anthropic" as const,
    modelId: "claude-sonnet-4-6",
    paidOnly: true,
  },
  "gpt-mini": {
    label: "GPT-5 mini",
    provider: "openai" as const,
    // モデルIDは利用可能な最新のminiモデルに合わせて更新してください
    modelId: "gpt-4o-mini",
    paidOnly: true,
  },
} as const

export type AiModelKey = keyof typeof AI_MODELS

// ===== ユーティリティ =====

/** UTC基準の "YYYY-MM" 文字列を返す */
export function currentYearMonth(): string {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

/** 当月のUTC開始・終了日時 */
export function currentMonthRange(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
  return { start, end }
}

/**
 * 有料ユーザー判定
 * - active: 通常の有料ユーザー
 * - canceled: 期間終了前は引き続き有料扱い
 */
export function checkIsPaid(billing: {
  plan: string
  status: string
  currentPeriodEnd: Date | null
} | null): boolean {
  if (!billing || billing.plan !== "standard") return false
  if (billing.status === "active") return true
  if (billing.status === "canceled" && billing.currentPeriodEnd && billing.currentPeriodEnd > new Date()) return true
  return false
}

// ===== AI呼び出し =====

export async function callAI(modelKey: AiModelKey, prompt: string): Promise<string> {
  const model = AI_MODELS[modelKey]

  if (model.provider === "anthropic") {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "" })
    const message = await client.messages.create({
      model: model.modelId,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    })
    const block = message.content[0]
    return block.type === "text" ? block.text : ""
  }

  if (model.provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model.modelId,
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    return data.choices?.[0]?.message?.content ?? ""
  }

  throw new Error("Unknown AI provider")
}
