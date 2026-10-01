/**
 * Single-build compatibility with both published dsh lines (issue #53).
 *
 * dsh 0.1.2-alpha renamed `CallId` to `ToolCallId` in `@deepseek-ai/dsh-llm`.
 * A named import of either symbol is an ESM link-time failure on the other
 * line (the module executes before any code runs, so the whole profile boot
 * dies). A namespace import never link-fails, and both constructors are pure
 * type brands (`id as Branded`), so one runtime lookup serves both lines.
 *
 * `RpcResult` also moved homes: rc.2 ships it from the removed
 * `@deepseek-ai/dsh-host-apiproxy/api`, the alpha as `ConnectionRpcResult`
 * from `@deepseek-ai/dsh-client-connection`. Both are the same structural
 * shape, so this local mirror avoids importing from either package.
 */

import * as llm from '@deepseek-ai/dsh-llm'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'

/** The branded tool-call id of whichever dsh-llm line is installed. */
export type ToolCallId = Extract<ContentBlock, { type: 'tool-call' }>['id']

/** Brand a string as a tool-call id: alpha's `ToolCallId`, rc.2's `CallId`. */
export const ToolCallId: (id: string) => ToolCallId = (() => {
  const exports = llm as Record<string, unknown>
  return (exports['ToolCallId'] ?? exports['CallId']) as (id: string) => ToolCallId
})()

/**
 * Structural mirror of the RPC result both dsh lines use (rc.2's apiproxy
 * `RpcResult`, the alpha's connection `ConnectionRpcResult`).
 */
export type RpcResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: string; message: string; details: object } }

/**
 * The 3-argument RPC handler face the plugin's `/api` bridge calls. DSH 0.2
 * widened `ConnectionRpcHandler` with a fourth `peer` argument; a function
 * accepting fewer parameters still satisfies it, and the fetch bridge only
 * ever passes the first three, so the plugin and its specs type handlers
 * against this narrower face instead of either line's declaration.
 */
export type SubscriptionsRpcHandler = (
  endpoint: string,
  payload: unknown,
  signal: AbortSignal,
) => Promise<RpcResult<unknown>>
