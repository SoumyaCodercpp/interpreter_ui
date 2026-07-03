import { useRef, useEffect, useState } from "react"

interface EditorProps {
  code: string
  onChange: (code: string) => void
  onRun: () => void
}

export function Editor({ code, onChange, onRun }: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const [lineCount, setLineCount] = useState(1)

  useEffect(() => {
    setLineCount(code.split("\n").length)
  }, [code])

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault()
      onRun()
    }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#252526" }}>
      {/* Header */}
      <div style={{ 
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 14px", background: "#2d2d2d", borderBottom: "1px solid #3c3c3c"
      }}>
        <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "#888", letterSpacing: "0.5px" }}>
          📝 main.lang
        </span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "10px", color: "#666" }}>Ctrl+Enter</span>
          <button
            onClick={onRun}
            style={{
              padding: "6px 18px", fontSize: "12px", fontWeight: 600,
              background: "#0e639c", color: "white", border: "none",
              borderRadius: "4px", cursor: "pointer",
            }}
          >
            ▶ Run
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          style={{
            background: "#1e1e1e",
            color: "#858585",
            padding: "14px 0",
            textAlign: "right",
            minWidth: "45px",
            fontFamily: "'Consolas', 'Courier New', monospace",
            fontSize: "14px",
            lineHeight: "1.6",
            userSelect: "none",
            overflow: "hidden",
            borderRight: "1px solid #333",
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} style={{ paddingRight: "12px" }}>{i + 1}</div>
          ))}
        </div>

        {/* Code Input */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          placeholder="Write your code here..."
          style={{
            flex: 1,
            background: "#1e1e1e",
            color: "#d4d4d4",
            padding: "14px",
            fontSize: "14px",
            lineHeight: "1.6",
            border: "none",
            outline: "none",
            resize: "none",
            fontFamily: "'Consolas', 'Courier New', monospace",
            tabSize: 2,
            whiteSpace: "pre",
            overflowWrap: "normal",
            overflowX: "auto",
          }}
        />
      </div>

      {/* Status Bar */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        padding: "4px 14px", background: "#007acc", color: "white",
        fontSize: "11px",
      }}>
        <span>Lines: {lineCount}</span>
        <span>Lang v1.0</span>
      </div>
    </div>
  )
}