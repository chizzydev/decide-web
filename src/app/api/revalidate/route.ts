import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

interface RevalidateBody {
  path?: string
  secret?: string
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as RevalidateBody
  const expectedSecret = process.env.REVALIDATE_SECRET

  if (!expectedSecret) {
    return NextResponse.json(
      {
        revalidated: false,
        message: 'REVALIDATE_SECRET is not configured.',
      },
      { status: 503 }
    )
  }

  if (!body.secret || body.secret !== expectedSecret) {
    return NextResponse.json(
      {
        revalidated: false,
        message: 'Invalid revalidation secret.',
      },
      { status: 401 }
    )
  }

  const path = body.path?.trim()

  if (!path || !path.startsWith('/')) {
    return NextResponse.json(
      {
        revalidated: false,
        message: 'A valid path starting with / is required.',
      },
      { status: 400 }
    )
  }

  revalidatePath(path)

  return NextResponse.json({
    revalidated: true,
    path,
  })
}
