/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const exts = ['.tsx', '.ts', '.jsx', '.js']

function walk(dir, fileList = []) {
  const names = fs.readdirSync(dir)
  for (const name of names) {
    if (name === 'node_modules' || name === '.next' || name === 'out') continue
    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) walk(full, fileList)
    else if (exts.includes(path.extname(name))) fileList.push(path.relative(root, full))
  }
  return fileList
}

function scan() {
  const files = walk(root)
  const results = []

  files.forEach((file) => {
    const abs = path.join(root, file)
    const content = fs.readFileSync(abs, 'utf-8')
    if (content.includes('<img')) {
      results.push({ file, type: 'img_element' })
    }
    if (
      content.includes("from 'next/image'") ||
      content.includes('from "next/image"') ||
      content.includes('<Image')
    ) {
      const hasUnoptimized = /unoptimized/.test(content)
      const hasFill = /\bfill\b/.test(content)
      const hasWidth = /width=/.test(content)
      const hasHeight = /height=/.test(content)
      const hasPriority = /priority/.test(content)
      results.push({
        file,
        type: 'next_image',
        hasUnoptimized,
        hasFill,
        hasWidth,
        hasHeight,
        hasPriority,
      })
    }
    const externalMatches = [...content.matchAll(/https?:\/\/[^"'\)\s>]+/g)].map((m) => m[0])
    if (externalMatches.length) {
      results.push({ file, type: 'external_urls', urls: Array.from(new Set(externalMatches)) })
    }
  })

  const summary = {
    totalFiles: files.length,
    findings: results,
  }

  console.log(JSON.stringify(summary, null, 2))
}

scan()
