import { useState } from "react"
import { Tokenizer, TokenManager } from "./fe/tokenizer"
import { Parser } from "./fe/parser"
import { Runner } from "./be/runner"
import type { Token } from "./fe/tokenizer"
import type { Block } from "./fe/ast"
import { Editor } from "./components/Editor"
import { OutputPanel } from "./components/OutputPanel"
import { TokenView } from "./components/TokenView"
import { ASTView } from "./components/ASTView"

function App() {
  const [code, setCode] = useState(`x = 10;\ny = 20;\nsum = x + y;\nprint("Sum is", sum);`)
  const [output, setOutput] = useState<string[]>([])
  const [tokens, setTokens] = useState<Token[]>([])
  const [ast, setAst] = useState<Block | null>(null)

  const handleRun = () => {
    try {
      const tokenizer = new Tokenizer(code)
      const tokenList = tokenizer.tokenize()
      setTokens(tokenList)
      const tokenManager = new TokenManager(tokenList)
      const parser = new Parser(tokenManager)
      const astTree = parser.parse()
      setAst(astTree)
      const runner = new Runner()
      runner.run(astTree)
      setOutput(runner.printed)
    } catch (e: any) {
      setOutput([`Error: ${e.message}`])
    }
  }

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      margin: 0,
      padding: 0,
      overflow: "hidden",
      background: "#1e1e1e",
      color: "#cccccc",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Title Bar */}
      <div style={{
        background: "#323233",
        padding: "10px 20px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#cccccc",
        borderBottom: "1px solid #3c3c3c",
        flexShrink: 0,
      }}>
        🧑‍💻 Language Playground
      </div>
      
      {/* Top Row: Editor + Tokens */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        <div style={{ flex: 1, borderRight: "1px solid #3c3c3c", overflow: "hidden" }}>
          <Editor code={code} onChange={setCode} onRun={handleRun} />
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <TokenView tokens={tokens} />
        </div>
      </div>
      
      {/* Bottom Row: Output + AST */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0, borderTop: "1px solid #3c3c3c" }}>
        <div style={{ flex: 1, borderRight: "1px solid #3c3c3c", overflow: "hidden" }}>
          <OutputPanel output={output} />
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <ASTView ast={ast} />
        </div>
      </div>
    </div>
  )
}

export default App