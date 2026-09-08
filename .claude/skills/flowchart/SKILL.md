---
description: 팀 표준 컨벤션에 맞춰 draw.io(diagrams.net) Flowchart XML(mxGraphModel)을 생성한다. 모드 full(전체 기능 흐름)·change(변경점 설계), 상세도 detail(기본)·core 지원.
disable-model-invocation: true
---

사용자가 `/flowchart`를 호출했다. 설명받은 처리 흐름을 **표준 draw.io Flowchart 컨벤션**에 맞춘 `mxGraphModel` XML로 생성한다. 결과 XML은 draw.io에 붙여넣어 바로 렌더된다.

## 사용 절차

1. **모드와 상세도를 정한다**:
   - 모드: `full`(기능의 전체 논리 흐름) / `change`(기존 기능의 변경/추가점만 강조)
   - 상세도: `detail`(기본, 전체 논리 및 분기 상세) / `core`(핵심 프로세스 위주)
2. 흐름(사용자 액션, Server Action/API, Supabase DB 쿼리, 분기 조건, 화면 렌더 등)을 파악한다.
3. 아래 **베이스 껍데기** 안에 **도형 카탈로그**의 스타일을 그대로 써서 노드를 배치하고, **엣지 규칙**으로 연결한다. **범례(팔레트) 블록은 항상 포함**한다.
4. 배치·크기·연결은 아래 **레이아웃 규칙**을 따른다.
5. 완성된 XML을 **프로젝트 루트 상대경로 `.claude-out/{기능명}.drawio.xml`** 로 저장하고 경로를 안내한다.
   - **저장 전 검증**: 출력 XML에 `<!-- -->` 주석이 없는지 확인한다 (주석 제거 필수).

---

## 모드 (`full` / `change`)

### `full` — 전체 기능 Flowchart
- 기능의 전체 논리 흐름을 START → END로 그린다.
- 관련 파일(클라이언트 컴포넌트, Server Action, Zustand Store, Supabase 등)을 읽어 흐름을 구성한다.
- 대형 도메인은 흐름 단위(예: 화면 렌더링, 특정 사용자 액션별)로 나누어 저장할 수 있다.

### `change` — 변경점 설계 Flowchart
- 기존 기능의 **개선/추가/수정**을 그린다.
- 전체 흐름을 다 그리지 않고 **변경점 위주**로 그리되, 맥락을 알 수 있도록 앞뒤 인접 앵커 노드를 1개씩 포함한다.
- 변경 노드는 테두리를 굵게(`strokeWidth=3`) 강조하고 라벨 앞에 `[신규]` / `[수정]` / `[삭제]` 태그를 붙인다.

---

## 레이아웃 규칙 (필수)

- 모든 좌표·간격은 **grid 4칸 = 40px 단위**로 정렬한다 (`gridSize=10`, 4칸=40px).
- 표준 도형 크기: **width 160 × height 40** (분기/노트/특수도형은 카탈로그 개별 크기).
- 세로 흐름 기본: 다음 노드 `y = 이전 노드 y + 이전 높이 + 40`.
- 모든 선은 **직교(수직·수평)**만 쓴다. 대각선 금지.
- 생성하는 XML에는 XML 주석(`<!-- ... -->`)을 넣지 않는다.

---

## 베이스 껍데기

```xml
<mxGraphModel dx="2741" dy="1654" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
  <root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />
    <mxCell id="lane" parent="1" vertex="1" value="{ 기능명 Flowchart }"
      style="swimlane;whiteSpace=wrap;html=1;fillColor=#f5f5f5;fontColor=#333333;strokeColor=#666666;">
      <mxGeometry x="-280" y="-80" width="560" height="800" as="geometry" />
    </mxCell>
  </root>
</mxGraphModel>
```

---

## 도형 카탈로그

### 터미널 (START / END) — 초록
```xml
<mxCell id="n1" parent="lane" vertex="1" value="START"
  style="rounded=1;whiteSpace=wrap;html=1;arcSize=50;fillColor=#d5e8d4;strokeColor=#82b366;">
  <mxGeometry x="160" y="80" width="160" height="40" as="geometry" />
</mxCell>
```

### 프로세스 (일반 로직) — 흰색
```xml
<mxCell id="n2" parent="lane" vertex="1" value="프로세스"
  style="rounded=0;whiteSpace=wrap;html=1;">
  <mxGeometry x="160" y="160" width="160" height="40" as="geometry" />
</mxCell>
```

### 조건 / 분기 (Decision) — 마름모
```xml
<mxCell id="n3" parent="lane" vertex="1" value="조건 분기"
  style="rhombus;whiteSpace=wrap;html=1;">
  <mxGeometry x="160" y="240" width="160" height="80" as="geometry" />
</mxCell>
```

### Server Action / API / DB 호출 — 파랑
```xml
<mxCell id="n4" parent="lane" vertex="1" value="Server Action 호출"
  style="rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;">
  <mxGeometry x="160" y="360" width="160" height="40" as="geometry" />
</mxCell>
```

### 사용자 액션 (클릭 / 입력) — 주황
```xml
<mxCell id="n5" parent="lane" vertex="1" value="사용자 액션"
  style="rounded=0;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;">
  <mxGeometry x="160" y="440" width="160" height="40" as="geometry" />
</mxCell>
```

### 부연 설명 노트 — 노랑
```xml
<mxCell id="n6" parent="lane" vertex="1"
  value="&lt;span style=&quot;font-size: 10px;&quot;&gt;&amp;nbsp;&lt;/span&gt;"
  style="shape=note2;boundedLbl=1;whiteSpace=wrap;html=1;size=25;verticalAlign=top;align=left;fillColor=#fff2cc;strokeColor=#000000;">
  <mxGeometry x="360" y="360" width="160" height="80" as="geometry" />
</mxCell>
<mxCell id="n6lbl" parent="n6" vertex="1" value="부연 설명"
  style="resizeWidth=1;part=1;strokeColor=none;fillColor=none;align=left;spacingLeft=5;fontSize=10;fontStyle=1">
  <mxGeometry width="160" height="25" relative="1" as="geometry" />
</mxCell>
```

### 에러 / 실패 처리 — 빨강
```xml
<mxCell id="n7" parent="lane" vertex="1"
  value="&lt;span style=&quot;font-size: 10px;&quot;&gt;&amp;nbsp;에러 Toast 표시&lt;/span&gt;"
  style="shape=note2;boundedLbl=1;whiteSpace=wrap;html=1;size=25;verticalAlign=top;align=left;fillColor=#f8cecc;strokeColor=#b85450;">
  <mxGeometry x="360" y="480" width="160" height="50" as="geometry" />
</mxCell>
<mxCell id="n7lbl" parent="n7" vertex="1" value="에러 처리"
  style="resizeWidth=1;part=1;strokeColor=none;fillColor=none;align=left;spacingLeft=5;fontSize=10;fontStyle=1">
  <mxGeometry width="160" height="25" relative="1" as="geometry" />
</mxCell>
```

---

## 엣지 규칙

### 흐름 연결선 (직교)
```xml
<mxCell id="e1" parent="lane" edge="1" source="n1" target="n2"
  style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;entryX=0.5;entryY=0;entryDx=0;entryDy=0;">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

### 분기 라벨 (Y / N)
```xml
<mxCell id="e2" parent="lane" edge="1" source="n3" target="n4" value="Y"
  style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;entryX=0.5;entryY=0;entryDx=0;entryDy=0;">
  <mxGeometry relative="1" as="geometry" />
</mxCell>
```

---

## 범례 (팔레트) — 필수 포함

```xml
<mxCell id="lg_terminal" parent="1" vertex="1" value="Process START/END"
  style="rounded=1;whiteSpace=wrap;html=1;arcSize=50;fillColor=#d5e8d4;strokeColor=#82b366;">
  <mxGeometry x="-280" y="-290" width="160" height="40" as="geometry" />
</mxCell>
<mxCell id="lg_action" parent="1" vertex="1" value="사용자 Action"
  style="rounded=0;whiteSpace=wrap;html=1;fillColor=#ffe6cc;strokeColor=#d79b00;">
  <mxGeometry x="-280" y="-180" width="160" height="40" as="geometry" />
</mxCell>
<mxCell id="lg_api" parent="1" vertex="1" value="Server Action / API"
  style="rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;">
  <mxGeometry x="-280" y="-130" width="160" height="40" as="geometry" />
</mxCell>
<mxCell id="lg_err" parent="1" vertex="1" value="에러 / 예외 처리"
  style="rounded=0;whiteSpace=wrap;html=1;fillColor=#f8cecc;strokeColor=#b85450;">
  <mxGeometry x="-110" y="-290" width="160" height="40" as="geometry" />
</mxCell>
<mxCell id="lg_note" parent="1" vertex="1" value="부연 설명"
  style="rounded=0;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#000000;">
  <mxGeometry x="-110" y="-180" width="160" height="40" as="geometry" />
</mxCell>
```

$ARGUMENTS
