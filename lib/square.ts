const BASE_URL =
  process.env.SQUARE_SANDBOX === "true"
    ? "https://connect.squareupsandbox.com/v2"
    : "https://connect.squareup.com/v2"

const SQUARE_VERSION = "2024-01-18"

function headers() {
  return {
    Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN ?? ""}`,
    "Content-Type": "application/json",
    "Square-Version": SQUARE_VERSION,
  }
}

export async function createPaymentLink(opts: {
  idempotencyKey: string
  name: string
  amountJpy: number
  redirectUrl: string
}) {
  const res = await fetch(`${BASE_URL}/online-checkout/payment-links`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      idempotency_key: opts.idempotencyKey,
      quick_pay: {
        name: opts.name,
        price_money: { amount: opts.amountJpy, currency: "JPY" },
        location_id: process.env.SQUARE_LOCATION_ID,
      },
      checkout_options: {
        redirect_url: opts.redirectUrl,
        ask_for_shipping_address: false,
      },
    }),
  })
  return res.json()
}

export async function getPayment(paymentId: string) {
  const res = await fetch(`${BASE_URL}/payments/${paymentId}`, {
    headers: headers(),
  })
  return res.json()
}

export async function getOrder(orderId: string) {
  const res = await fetch(`${BASE_URL}/orders/${orderId}`, {
    headers: headers(),
  })
  return res.json()
}

// オーダーに紐づく Payment 一覧を取得（Payment Link 決済確認の最終手段）
export async function getPaymentsByOrderId(orderId: string) {
  const res = await fetch(
    `${BASE_URL}/payments?order_id=${encodeURIComponent(orderId)}`,
    { headers: headers() }
  )
  return res.json()
}
