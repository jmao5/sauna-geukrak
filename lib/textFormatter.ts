export const formatNovelText = (text: string): string => {
  if (!text) return ''

  let formatted = text

  // 1. 기본 정규화 (CRLF -> LF)
  formatted = formatted.replace(/\r\n/g, '\n')

  // 2. [핵심] 엉뚱한 줄바꿈 연결하기 (모바일 가독성 킬러 기능)
  // 문장이 마침표(.?!)나 따옴표("')로 끝나지 않았는데 줄바꿈이 된 경우,
  // 이를 공백으로 치환하여 문장을 이어줍니다.
  // (예: 사진 속 "그 '출신'\n에 있다고" -> "그 '출신' 에 있다고")
  formatted = formatted.replace(/([^\n.!?”"’'])\n(?=[가-힣a-zA-Z0-9])/g, '$1 ')

  // 3. 문장 단위 강제 줄바꿈 (웹소설 스타일)
  // 마침표 뒤에 문자가 이어지면 강제로 2줄 띄웁니다.
  // 예: "생각했다. 굳이" -> "생각했다.\n\n굳이"
  // 단, Lv.99 같은 소수점이나 약어는 제외하기 위해 뒤에 공백이 있는 경우만 처리
  formatted = formatted.replace(/([.!?])\s+(?=[가-힣"'(])/g, '$1\n\n')

  // 4. 대화문 확실하게 분리
  // 닫는 따옴표 뒤에 한글이 오면 줄바꿈
  formatted = formatted.replace(/(["'”’])([가-힣a-zA-Z0-9])/g, '$1\n\n$2')
  // 여는 따옴표 앞에 글자가 있으면 줄바꿈
  formatted = formatted.replace(/([가-힣a-zA-Z0-9.!?…])\s*(["'“‘])/g, '$1\n\n$2')

  // 5. 문단 간격 확실하게 벌리기
  // 남아있는 단일 줄바꿈(\n)을 모두 2중 줄바꿈(\n\n)으로 변경
  formatted = formatted.replace(/\n/g, '\n\n')

  // 6. 과도한 공백 정리 (3줄 이상 빈 공간 -> 2줄로)
  formatted = formatted.replace(/\n{3,}/g, '\n\n')

  return formatted.trim()
}
