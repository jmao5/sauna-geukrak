#!/usr/bin/env node

/**
 * ============================================================================
 * protect_env.js — Antigravity & AI Agent PreToolUse 보안 hook
 * ============================================================================
 * @description
 *   환경 변수 파일(`.env.local`, `.env.production` 등)에 대한
 *   view_file, write_to_file, replace_file_content, run_command 등 도구 호출을 차단한다.
 *
 *   Supabase Service Role Key, VAPID Private Key 등 민감 시크릿이
 *   에이전트에게 불필요하게 노출되거나 실수로 덮어쓰여지는 것을 방지한다.
 *
 * @register
 *   .agents/hooks.json 의 PreToolUse 에 등록되어 동작함.
 * ============================================================================
 */

/* ----- 차단 대상 경로/명령 패턴 ----- */
const BLOCKED_PATTERNS = [
  '.env.local',
  '.env.production',
  '.env.secret',
  '.env',
]

/**
 * 주어진 문자열(파일 경로 또는 쉘 명령)이 차단 패턴에 해당하는지 검사.
 * 단, .env.example 등 공개 템플릿 파일은 허용한다.
 */
function isBlocked(text) {
  if (!text) return false
  const normalized = text.replace(/\\/g, '/').toLowerCase()
  if (normalized.includes('.env.example')) {
    return false
  }
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

    // 1. Antigravity Hook 프로토콜 (toolCall 객체 지원)
    if (data.toolCall) {
      const toolName = data.toolCall.name || ''
      const args = data.toolCall.args || {}

      let blocked = false
      let targetText = ''

      // 도구별 인자 검사
      if (args.AbsolutePath && isBlocked(args.AbsolutePath)) {
        blocked = true
        targetText = args.AbsolutePath
      } else if (args.TargetFile && isBlocked(args.TargetFile)) {
        blocked = true
        targetText = args.TargetFile
      } else if (args.CommandLine && isBlocked(args.CommandLine)) {
        blocked = true
        targetText = args.CommandLine
      } else if (args.SearchPath && isBlocked(args.SearchPath)) {
        blocked = true
        targetText = args.SearchPath
      } else {
        // 기타 인자 값 순회 검사
        for (const val of Object.values(args)) {
          if (typeof val === 'string' && isBlocked(val)) {
            blocked = true
            targetText = val
            break
          }
        }
      }

      if (blocked) {
        process.stdout.write(
          JSON.stringify({
            decision: 'deny',
            reason: `BLOCKED: 환경 변수 및 시크릿 설정 파일(${targetText}) 접근이 보안상 차단되었습니다.`,
          })
        )
        process.exit(0)
      }

      process.stdout.write(JSON.stringify({ decision: 'allow' }))
      process.exit(0)
    }

    // 2. Claude Code 훅 호환성 (tool_name / tool_input 지원)
    if (data.tool_name) {
      const toolName = data.tool_name
      const toolInput = data.tool_input || {}

      if (['Read', 'Edit', 'Write'].includes(toolName)) {
        if (isBlocked(toolInput.file_path)) {
          process.stderr.write('BLOCKED: 환경 변수 및 시크릿 설정 파일 접근이 보안상 차단되었습니다.')
          process.exit(2)
        }
      }

      if (['Bash', 'PowerShell'].includes(toolName)) {
        const cmd = toolInput.command || ''
        if (isBlocked(cmd)) {
          process.stderr.write('BLOCKED: 환경 변수 파일 관련 명령 실행이 차단되었습니다.')
          process.exit(2)
        }
      }

      process.exit(0)
    }

    // 기본 통과
    process.stdout.write(JSON.stringify({ decision: 'allow' }))
    process.exit(0)
  } catch (e) {
    // 파싱 오류 시 기본 허용
    process.stdout.write(JSON.stringify({ decision: 'allow' }))
    process.exit(0)
  }
})
