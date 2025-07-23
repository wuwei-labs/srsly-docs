import React, { useState } from 'react'
import Editor from 'react-simple-code-editor'
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/themes/prism-dark.css'

interface SDKCodeEditorProps {
  initialCode: string
  onChange: (code: string) => void
  error?: string
  className?: string
}

export function SDKCodeEditor({ initialCode, onChange, error, className = '' }: SDKCodeEditorProps) {
  const [code, setCode] = useState(initialCode)

  const handleChange = (newCode: string) => {
    setCode(newCode)
    onChange(newCode)
  }

  return (
    <div className={`border border-border rounded-lg overflow-hidden ${className}`}>
      <div className="bg-muted/50 border-b border-border p-3">
        <h4 className="text-sm font-medium">SDK Code Editor - Edit and Execute</h4>
      </div>
      <div className="bg-gray-900">
        <Editor
          value={code}
          onValueChange={handleChange}
          highlight={code => highlight(code, languages.js)}
          padding={16}
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: 14,
            lineHeight: 1.5,
            minHeight: '200px',
            backgroundColor: 'transparent',
            color: '#e2e8f0'
          }}
        />
      </div>
      
      {error && (
        <div className="border-t border-red-500/20 bg-red-950/50 p-3">
          <div className="text-red-400 text-sm">
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}
    </div>
  )
}