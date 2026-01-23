'use client'

import Editor from '@monaco-editor/react'
import { motion } from 'framer-motion'
import { Check, Copy, Play } from 'lucide-react'
import { useState } from 'react'

export default function CodeEditor() {
  const [code, setCode] = useState(`def fibonacci(n):
    """Calculate fibonacci number at position n"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# Try to optimize this!
result = fibonacci(35)
print(f"Result: {result}")
`)

  const [language, setLanguage] = useState('python')
  const [copied, setCopied] = useState(false)
  
  interface ErrorDetails {
    details?: string;
    troubleshooting?: {
      likely_cause?: string;
      solution?: string;
      documentation?: string;
    };
    backend_url?: string;
    is_configured?: boolean;
  }
  
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleEditorChange = (value: string | undefined) => {
    if (value) setCode(value)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRun = async () => {
    setError(null)
    setErrorDetails(null)
    setIsAnalyzing(true)
    
    try {
      // Use environment variable or fallback to relative path for local dev
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const apiUrl = `${apiBaseUrl}/api/ai-console/analyze`;
      
      console.log('Analyzing code at:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code,
          language: language
        })
      })

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('API error:', response.status, errorData);
        
        // Display detailed error information
        if (errorData.troubleshooting) {
          setError(errorData.error || 'Analysis failed');
          setErrorDetails(errorData);
        } else {
          setError(`Failed to analyze code: ${response.status} ${response.statusText}`);
        }
        return;
      }

      const data = await response.json()
      if (data.success) {
        // Open playground with analysis results
        window.open('/playground?code=' + encodeURIComponent(code), '_blank')
      } else {
        console.error('Analysis failed:', data);
        
        // Display detailed error if available
        if (data.troubleshooting) {
          setError(data.error || 'Analysis failed');
          setErrorDetails(data);
        } else {
          setError(data.error || 'Unknown error occurred');
        }
      }
    } catch (error) {
      console.error('Error analyzing code:', error)
      setError('Error connecting to backend');
      setErrorDetails({
        details: error instanceof Error ? error.message : 'Unknown error',
        troubleshooting: {
          likely_cause: 'Network connectivity issue or backend service is down',
          solution: 'Check your internet connection and verify the backend service is running'
        }
      });
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full space-y-4"
    >
      {/* Header with controls */}
      <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 rounded-t-lg px-4 py-3">
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-700 text-white px-3 py-1.5 rounded text-sm border border-slate-600 hover:border-slate-500 transition-colors"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          <span className="text-xs text-slate-400">Interactive Code Editor</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-sm transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>

          <button
            onClick={handleRun}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-3 py-1.5 rounded text-sm font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" />
            {isAnalyzing ? 'Analyzing...' : 'Run'}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="border border-slate-200 rounded-b-lg overflow-hidden shadow-lg">
        <Editor
          height="400px"
          language={language}
          value={code}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3"
        >
          <div className="flex items-start gap-2">
            <div className="text-red-600 font-semibold text-sm">❌ {error}</div>
            <button
              onClick={() => { setError(null); setErrorDetails(null); }}
              className="ml-auto text-red-400 hover:text-red-600 text-xs"
            >
              ✕
            </button>
          </div>
          
          {errorDetails && (
            <div className="space-y-2 text-sm">
              {errorDetails.details && (
                <div className="text-red-700">
                  <span className="font-medium">Details:</span> {errorDetails.details}
                </div>
              )}
              
              {errorDetails.troubleshooting && (
                <div className="bg-red-100 rounded p-3 space-y-2">
                  <div className="font-semibold text-red-900">🔧 Troubleshooting</div>
                  
                  {errorDetails.troubleshooting.likely_cause && (
                    <div className="text-red-800">
                      <span className="font-medium">Likely cause:</span> {errorDetails.troubleshooting.likely_cause}
                    </div>
                  )}
                  
                  {errorDetails.troubleshooting.solution && (
                    <div className="text-red-800">
                      <span className="font-medium">Solution:</span> {errorDetails.troubleshooting.solution}
                    </div>
                  )}
                  
                  {errorDetails.troubleshooting.documentation && (
                    <div className="text-red-700 text-xs">
                      📖 {errorDetails.troubleshooting.documentation}
                    </div>
                  )}
                </div>
              )}
              
              {errorDetails.backend_url && (
                <div className="text-red-600 text-xs font-mono">
                  Backend URL: {errorDetails.backend_url}
                  {errorDetails.is_configured === false && (
                    <span className="ml-2 text-red-500">(not configured - using fallback)</span>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Info message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <span className="font-semibold">💡 Pro tip:</span> This is a live editor. Write your code and hit <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded">Run</span> to get AI feedback!
      </div>
    </motion.div>
  )
}
