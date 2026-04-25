/// <reference types="@cloudflare/workers-types/2023-07-01" />

// 重新导出 Env 类型，使测试文件能直接引用
type Env = import('../functions/lib/env').Env
