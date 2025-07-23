import React, { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Button } from './button'

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

export function CodeBlock({ code, language = 'javascript', className = '' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  return (
    <div className={`relative rounded-md overflow-hidden ${className}`}>
      <div className="absolute right-2 top-2 z-10">
        <Button
          onClick={handleCopy}
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          paddingTop: '2.5rem',
          fontSize: '0.875rem',
          lineHeight: '1.25rem',
        }}
        showLineNumbers={false}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}