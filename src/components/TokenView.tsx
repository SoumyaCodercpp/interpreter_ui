import type { Token } from "../fe/tokenizer"

interface TokenViewProps { tokens: Token[] }

function getColor(type: string): string {
  if (type === "number" || type === "string") return "#ce9178"
  if (type === "print") return "#dcdcaa"
  if (type === "identifier") return "#9cdcfe"
  if (["true","false","null"].includes(type)) return "#569cd6"
  if (["if","else","while","fn","return"].includes(type)) return "#c586c0"
  return "#d4d4d4"
}

export function TokenView({ tokens }: TokenViewProps) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#252526" }}>
      <div style={{ padding: "8px 14px", background: "#2d2d2d", borderBottom: "1px solid #3c3c3c" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "#888", letterSpacing: "0.5px" }}>
          🔤 Tokens
        </span>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: "'Consolas', monospace" }}>
          <thead>
            <tr style={{ background: "#2d2d2d", position: "sticky", top: 0 }}>
              <th style={th}>#</th><th style={th}>Type</th><th style={th}>Value</th><th style={th}>Line</th><th style={th}>Col</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((t, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#1e1e1e" : "#252526" }}>
                <td style={td}>{i}</td>
                <td style={{ ...td, color: getColor(t.type) }}>{t.type}</td>
                <td style={td}>{(t as any).val ?? ""}</td>
                <td style={td}>{t.loc.start.line}</td>
                <td style={td}>{t.loc.start.col}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const th: React.CSSProperties = { padding: "5px 10px", textAlign: "left", color: "#888", fontSize: "11px", fontWeight: 600 }
const td: React.CSSProperties = { padding: "3px 10px", borderBottom: "1px solid #333" }