/**
 * 创建 EventContext 兼容对象
 */

import type { Env } from '../lib/env'

export function createContext(
  request: Request,
  env: Env
): EventContext<Env, string, Record<string, unknown>> {
  return {
    request,
    env,
    params: {},
    data: {},
    next: () => Promise.resolve(new Response('Not Found', { status: 404 })),
    waitUntil: () => {},
    passThroughOnException: () => {},
    functionPath: '',
  } as unknown as EventContext<Env, string, Record<string, unknown>>
}
