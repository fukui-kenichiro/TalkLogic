const PAYJP_API = "https://api.pay.jp/v1"

function authHeader(): string {
  const key = process.env.PAYJP_SECRET_KEY ?? ""
  return "Basic " + Buffer.from(`${key}:`).toString("base64")
}

function formBody(params: Record<string, string>): string {
  return new URLSearchParams(params).toString()
}

// ===== Customer =====

export async function createCustomer(cardToken: string) {
  const res = await fetch(`${PAYJP_API}/customers`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody({ card: cardToken }),
  })
  return res.json()
}

// ===== Subscription =====

export async function createSubscription(
  customerId: string,
  planId: string
) {
  const res = await fetch(`${PAYJP_API}/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formBody({ customer: customerId, plan: planId }),
  })
  return res.json()
}

export async function cancelSubscription(subscriptionId: string) {
  // 期間終了時に解約（即時解約でなく猶予あり）
  const res = await fetch(
    `${PAYJP_API}/subscriptions/${subscriptionId}/cancel`,
    {
      method: "POST",
      headers: { Authorization: authHeader() },
    }
  )
  return res.json()
}

export async function retrieveSubscription(subscriptionId: string) {
  const res = await fetch(
    `${PAYJP_API}/subscriptions/${subscriptionId}`,
    {
      headers: { Authorization: authHeader() },
    }
  )
  return res.json()
}
