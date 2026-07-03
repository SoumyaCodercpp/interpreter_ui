import { useRef, useEffect, useState } from "react"

interface OutputPanelProps {
  output: string[]
}

export function OutputPanel({ output }: OutputPanelProps) {
  const outputRef = useRef<HTMLDivElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const [lineCount, setLineCount] = useState(1)

  useEffect(() => {
    setLineCount(output.length || 1)
  }, [output])

  const handleScroll = () => {
    if (outputRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = outputRef.current.scrollTop
    }
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#252526" }}>
      {/* Header */}
      <div style={{
        padding: "8px 14px", background: "#2d2d2d", borderBottom: "1px solid #3c3c3c",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "#888", letterSpacing: "0.5px" }}>
          📤 Output
        </span>
        {output.length > 0 && (
          <span style={{ fontSize: "10px", color: "#4ec9b0" }}>
            ✓ {output.length} line{output.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Output Body */}
      {output.length === 0 ? (
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#666", fontFamily: "'Consolas', monospace", fontSize: "13px"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>▶</div>
            <div>Run code to see output</div>
            <div style={{ fontSize: "10px", color: "#555", marginTop: "4px" }}>Ctrl+Enter</div>
          </div>
        </div>
      ) : (
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

          {/* Output Text */}
          <div
            ref={outputRef}
            onScroll={handleScroll}
            style={{
              flex: 1,
              background: "#1e1e1e",
              padding: "14px",
              overflow: "auto",
              fontFamily: "'Consolas', 'Courier New', monospace",
              fontSize: "14px",
              lineHeight: "1.6",
              whiteSpace: "pre-wrap",
            }}
          >
            {output.map((line, i) => (
              <div key={i} style={{
                color: line.startsWith("Error:") ? "#f44747" : "#d4d4d4",
                minHeight: "1.6em",
              }}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        padding: "4px 14px", background: output.length > 0 ? "#0e639c" : "#333",
        color: "white", fontSize: "11px",
      }}>
        <span>{output.length > 0 ? `Output (${output.length} lines)` : "Ready"}</span>
        <span>{output.length > 0 ? "✓ Success" : "Waiting..."}</span>
      </div>
    </div>
  )
}