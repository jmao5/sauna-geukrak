#!/usr/bin/env node

/**
 * ============================================================================
 * protect_env.js — Claude Code PreToolUse 보안 hook
 * ============================================================================
 * @description
 *   환경 변수 파일(`.env`, `.env.local` 등)에 대한
 *   Read/Edit/Write/Bash/PowerShell 도구 호출을 차단한다.
 *
 *   Supabase Service Role Key, VAPID Private Key 등 민감 시크릿이
 *   Claude에게 불필요하게 노출되거나 실수로 덮어쓰여지는 것을 방지한다.
 *
 * @register
 *   .claude/settings.json 의 hooks.PreToolUse 에 등록되어 동작함.
 * ============================================================================
 */

/* ----- 차단 대상 경로/명령 패턴 ----- */
const BLOCKED_PATTERNS = [
  '.env.local',
  '.env.production',
  '.env.secret',
]

/**
 * 주어진 문자열(파일 경로 또는 쉘 명령)이 차단 패턴에 해당하는지 검사.
 */
function isBlocked(text) {
  if (!text) return false
  const normalized = text.replace(/\\/g, '/').toLowerCase()
  return BLOCKED_PATTERNS.some((p) => normalized.includes(p.toLowerCase()))
}

let input = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => {
  input += chunk
})

process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input)
    const toolName = data.tool_name || ''
    const toolInput = data.tool_input || {}

    // 파일 도구(Read/Edit/Write): file_path 인자에 보호 파일이 포함되면 차단
    if (['Read', 'Edit', 'Write'].includes(toolName)) {
      if (isBlocked(toolInput.file_path)) {
        process.stderr.write('BLOCKED: 환경 변수 및 시크릿 설정 파일 접근이 보안상 차단되었습니다.')
        process.exit(2)
      }
    }

    // 쉘 도구(Bash/PowerShell): command 문자열에 보호 파일이 등장하면 차단
    if (['Bash', 'PowerShell'].includes(toolName)) {
      const cmd = toolInput.command || ''
      if (isBlocked(cmd)) {
        process.stderr.write('BLOCKED: 환경 변수 파일 관련 명령 실행이 차단되었습니다.')
        process.exit(2)
      }
    }
  } catch (e) {
    // 파싱 실패 시 안전을 위해 통과
  }
  process.exit(0)
})
