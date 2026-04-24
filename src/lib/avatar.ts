// 本地用户头像列表（public/User 文件夹下的 SVG）
export const AVATAR_LIST = Array.from({ length: 51 }, (_, i) => `User_${i + 1}`)

// 将字符串哈希为 1~max 的整数
function hashToIndex(str: string, max: number): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return (Math.abs(hash) % max) + 1
}

/**
 * 获取用户头像 URL
 * 兼容旧版 DiceBear seed：若 avatar 不是 User_X 格式，则哈希映射到本地头像
 */
export function getUserAvatarUrl(avatar?: string | null): string {
  if (avatar && avatar.startsWith('User_')) {
    return `/User/${avatar}.svg`
  }
  const seed = avatar || 'default'
  const index = hashToIndex(seed, 51)
  return `/User/User_${index}.svg`
}
