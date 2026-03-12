import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { z } from "zod"

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  nickname: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: validated.username },
          { email: validated.email },
        ],
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "ユーザー名またはメールアドレスは既に使用されています" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        username: validated.username,
        email: validated.email,
        password: hashedPassword,
        nickname: validated.nickname || validated.username,
      },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        createdAt: true,
      },
    })

    // Create default billing record
    await prisma.billing.create({
      data: {
        userId: user.id,
        plan: "free",
        status: "active",
      },
    })

    return NextResponse.json(
      { message: "ユーザー登録が完了しました", user },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "入力データが不正です", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "登録処理中にエラーが発生しました" },
      { status: 500 }
    )
  }
}
