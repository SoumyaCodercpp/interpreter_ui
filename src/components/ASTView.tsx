import type { Block, ASTNode } from "../fe/ast"
import { useState } from "react"

interface ASTViewProps { ast: Block | null }

const nodeColors: Record<string, string> = {
  Block: "#c586c0",
  AssignmentStatement: "#569cd6",
  ExpressionStatement: "#569cd6",
  IfStatement: "#dcdcaa",
  WhileLoop: "#dcdcaa",
  FunctionDeclaration: "#4ec9b0",
  ReturnStatement: "#ce9178",
  BinaryExpression: "#9cdcfe",
  UnaryExpression: "#9cdcfe",
  Call: "#dcdcaa",
  Identifier: "#9cdcfe",
  NumberLiteral: "#ce9178",
  StringLiteral: "#ce9178",
  BooleanLiteral: "#569cd6",
  NullLiteral: "#569cd6",
  PropAccess: "#4ec9b0",
  ElementAccess: "#4ec9b0",
  ArrayLiteral: "#4ec9b0",
  ObjectLiteral: "#4ec9b0",
  ParenthesizedExpression: "#888",
  PrintKeyword: "#dcdcaa",
}

function ASTNodeView({ node, depth = 0 }: { node: any; depth?: number }) {
  const [collapsed, setCollapsed] = useState(false)

  if (!node || typeof node !== "object") {
    return <span style={{ color: "#ce9178" }}>{JSON.stringify(node)}</span>
  }

  const nodeType = node.type || "Object"
  const color = nodeColors[nodeType] || "#888"
  const isExpandable = typeof node === "object" && Object.keys(node).length > 2

  return (
    <div style={{ marginLeft: depth * 16 }}>
      <div 
        onClick={() => isExpandable && setCollapsed(!collapsed)} 
        style={{ cursor: isExpandable ? "pointer" : "default", lineHeight: "1.8" }}
      >
        {isExpandable && <span style={{ color: "#666", marginRight: "4px" }}>{collapsed ? "▶" : "▼"}</span>}
        <span style={{ color: color, fontWeight: 600 }}>{nodeType}</span>
        {nodeType === "Identifier" && node.name && (
          <span style={{ color: "#9cdcfe" }}> ({node.name})</span>
        )}
        {nodeType === "NumberLiteral" && node.value !== undefined && (
          <span style={{ color: "#ce9178" }}> {node.value}</span>
        )}
        {nodeType === "StringLiteral" && node.value !== undefined && (
          <span style={{ color: "#ce9178" }}> "{node.value}"</span>
        )}
        {nodeType === "BooleanLiteral" && node.value !== undefined && (
          <span style={{ color: "#569cd6" }}> {String(node.value)}</span>
        )}
        {nodeType === "BinaryExpression" && node.operator && (
          <span style={{ color: "#dcdcaa" }}> ({node.operator})</span>
        )}
      </div>
      
      {!collapsed && typeof node === "object" && (
        <div>
          {Object.entries(node).map(([key, value]) => {
            if (key === "type" || key === "id" || key === "loc") return null
            return (
              <div key={key} style={{ marginLeft: 16 }}>
                <span style={{ color: "#888", fontSize: "11px" }}>{key}: </span>
                {typeof value === "object" && value !== null ? (
                  <ASTNodeView node={value} depth={depth + 1} />
                ) : (
                  <span style={{ color: "#d4d4d4", fontSize: "12px" }}>{JSON.stringify(value)}</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ASTView({ ast }: ASTViewProps) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#252526" }}>
      <div style={{ padding: "8px 14px", background: "#2d2d2d", borderBottom: "1px solid #3c3c3c" }}>
        <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "#888", letterSpacing: "0.5px" }}>
          🌳 AST
        </span>
      </div>
      <div style={{
        flex: 1, padding: "14px", overflow: "auto",
        fontFamily: "'Consolas', 'Courier New', monospace", fontSize: "12px",
        lineHeight: "1.5",
      }}>
        {ast ? <ASTNodeView node={ast} /> : (
          <span style={{ color: "#666" }}>Run code to see AST...</span>
        )}
      </div>
    </div>
  )
}