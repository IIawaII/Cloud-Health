/**
 * Cloudflare Turnstile 验证工具
 */

export async function verifyTurnstile(
  token: string,
  secretKey: string,
  ip?: string
): Promise<boolean> {
  const formData = new URLSearchParams()
  formData.append('secret', secretKey)
  formData.append('response', token)
  if (ip) {
    formData.append('remoteip', ip)
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const data = await response.json<{ success: boolean }>()
    return data.success
  } catch {
    return false
  }
}
