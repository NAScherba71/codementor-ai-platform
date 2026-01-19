'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface WelcomingTourModalProps {
  show: boolean;
  onClose: () => void;
}

export function WelcomingTourModal({ show, onClose }: WelcomingTourModalProps) {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!show) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [show, onClose]);

  // Reset to first tab when modal closes
  useEffect(() => {
    if (!show) {
      setActiveTab(0);
    }
  }, [show]);

  const tabs = [
    { id: 0, label: 'What are LLM Providers?', shortLabel: 'Intro' },
    { id: 1, label: 'Local Models', shortLabel: 'Local' },
    { id: 2, label: 'Google Gemini', shortLabel: 'Gemini' },
    { id: 3, label: 'OpenRouter', shortLabel: 'OpenRouter' },
    { id: 4, label: 'Configuration Guide', shortLabel: 'Config' },
    { id: 5, label: 'Testing & Troubleshooting', shortLabel: 'Test' },
  ];

  const handleNext = () => {
    if (activeTab < tabs.length - 1) {
      setActiveTab(activeTab + 1);
    }
  };

  const handlePrevious = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-modal-title"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
              <h2 id="tour-modal-title" className="text-2xl font-bold text-slate-900">
                LLM Provider Guide
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X className="w-5 h-5 text-slate-500" />
              </Button>
            </div>

            {/* Tab Navigation */}
            <div className="flex overflow-x-auto border-b border-slate-200 px-6 gap-2 flex-shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                  aria-selected={activeTab === tab.id}
                  role="tab"
                >
                  <span className="hidden md:inline">{tab.label}</span>
                  <span className="md:hidden">{tab.shortLabel}</span>
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 0 && <IntroTab />}
                  {activeTab === 1 && <LocalModelsTab />}
                  {activeTab === 2 && <GeminiTab />}
                  {activeTab === 3 && <OpenRouterTab />}
                  {activeTab === 4 && <ConfigurationTab />}
                  {activeTab === 5 && <TroubleshootingTab />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer with Navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
              <div className="text-sm text-slate-500">
                {activeTab + 1} of {tabs.length}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={activeTab === 0}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                {activeTab === tabs.length - 1 ? (
                  <Button
                    onClick={onClose}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    Got it, thanks!
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Tab Components
function IntroTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">What is an LLM Provider?</h3>
        <p className="text-slate-600 leading-relaxed">
          An LLM (Large Language Model) Provider is the AI engine that powers your CodeMentor experience. 
          Think of it as choosing which AI brain will help you learn programming.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Why Choose Different Providers?</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span><strong>Privacy:</strong> Local models keep everything on your machine</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span><strong>Power:</strong> Cloud providers like Gemini offer advanced capabilities</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span><strong>Flexibility:</strong> OpenRouter lets you choose from many different models</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span><strong>Cost:</strong> Some are free, others are pay-as-you-go</span>
          </li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-slate-900 mb-3">Available Providers</h4>
        <div className="grid gap-3">
          <ProviderSummaryCard
            emoji="🌍"
            name="Local Models"
            description="Self-hosted, private, and free"
            color="blue"
          />
          <ProviderSummaryCard
            emoji="☁️"
            name="Google Gemini"
            description="Powerful cloud AI with free tier"
            color="orange"
          />
          <ProviderSummaryCard
            emoji="🔌"
            name="OpenRouter"
            description="Access GPT-4, Claude, and more"
            color="purple"
          />
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
        <p className="text-sm text-indigo-900">
          <strong>👉 Tip:</strong> Start with <strong>Local Models</strong> for privacy and simplicity. 
          Upgrade to cloud providers when you need more advanced features.
        </p>
      </div>
    </div>
  );
}

function LocalModelsTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="text-5xl">🌍</div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Local Models</h3>
          <p className="text-lg text-blue-600 font-medium">Private & Self-hosted (Default)</p>
        </div>
      </div>

      <p className="text-slate-600 leading-relaxed">
        Your personal AI tutor running locally on your machine. Perfect for learning without 
        sending any data to external servers.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
        <h4 className="font-semibold text-blue-900 mb-3">✓ Key Features</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>Complete Privacy</strong> - No data sent to external servers</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>No API Keys Needed</strong> - Works out of the box</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>TinyLlama-1.1B Chat Model</strong> - Optimized for learning</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>Works Offline</strong> - No internet required</span>
          </li>
        </ul>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
        <h4 className="font-semibold text-slate-900 mb-2">When to Use Local Models</h4>
        <p className="text-sm text-slate-600">
          <strong>Best for:</strong> Learning and experimentation, privacy-focused development, 
          offline coding practice, and getting started without configuration.
        </p>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h4 className="font-semibold text-slate-900 mb-3">Quick Setup</h4>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono text-xs">⏱️ 2 minutes</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-mono text-xs">Easy</span>
          </div>
          <p>1. Local models are the default - no setup required!</p>
          <p>2. Just make sure the AI engine is running</p>
          <p>3. Start chatting in the AI Console</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/playground" className="flex-1">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Configure in AI Console →
          </Button>
        </Link>
      </div>
    </div>
  );
}

function GeminiTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="text-5xl">☁️</div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Google Gemini</h3>
          <p className="text-lg text-orange-600 font-medium">Powerful Cloud AI</p>
        </div>
      </div>

      <p className="text-slate-600 leading-relaxed">
        Google's latest Gemini model via Vertex AI. Advanced AI capabilities with a generous 
        free tier for developers.
      </p>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
        <h4 className="font-semibold text-orange-900 mb-3">✓ Key Features</h4>
        <ul className="space-y-2 text-sm text-orange-800">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>Advanced AI Capabilities</strong> - State-of-the-art model</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>Free Tier Available</strong> - Generous quota for learning</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>Cloud-based</strong> - Requires internet connection</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>Google Authentication</strong> - Secure access via GCP</span>
          </li>
        </ul>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
        <h4 className="font-semibold text-slate-900 mb-2">When to Use Google Gemini</h4>
        <p className="text-sm text-slate-600">
          <strong>Best for:</strong> Advanced features and production use, complex code analysis, 
          when you need cutting-edge AI capabilities, and professional development.
        </p>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h4 className="font-semibold text-slate-900 mb-3">Quick Setup</h4>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded font-mono text-xs">⏱️ 10 minutes</span>
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-mono text-xs">Medium</span>
          </div>
          <p>1. Set up Google Cloud Platform account</p>
          <p>2. Enable Vertex AI API</p>
          <p>3. Configure authentication credentials</p>
          <p>4. Select "Google Gemini" in AI Console Settings</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/playground" className="flex-1">
          <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
            Configure in AI Console →
          </Button>
        </Link>
      </div>
    </div>
  );
}

function OpenRouterTab() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="text-5xl">🔌</div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">OpenRouter</h3>
          <p className="text-lg text-purple-600 font-medium">Access Any LLM</p>
        </div>
      </div>

      <p className="text-slate-600 leading-relaxed">
        Route your requests to any LLM provider. Choose from GPT-4, Claude, Llama, and dozens 
        of other models through a single API.
      </p>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-5">
        <h4 className="font-semibold text-purple-900 mb-3">✓ Key Features</h4>
        <ul className="space-y-2 text-sm text-purple-800">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>Choose from Multiple Models</strong> - GPT-4, Claude, Llama, and more</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>Flexible Model Selection</strong> - Switch between models easily</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>Pay-as-you-go Pricing</strong> - Only pay for what you use</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">✓</span>
            <span><strong>Requires API Key</strong> - Get yours at openrouter.ai</span>
          </li>
        </ul>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
        <h4 className="font-semibold text-slate-900 mb-2">When to Use OpenRouter</h4>
        <p className="text-sm text-slate-600">
          <strong>Best for:</strong> Flexibility and trying different models, experimenting with 
          various AI approaches, comparing model outputs, and accessing premium models.
        </p>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <h4 className="font-semibold text-slate-900 mb-3">Quick Setup</h4>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-mono text-xs">⏱️ 5 minutes</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-mono text-xs">Easy</span>
          </div>
          <p>1. Sign up at <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">openrouter.ai</a></p>
          <p>2. Get your API key from the dashboard</p>
          <p>3. Select "OpenRouter" in AI Console Settings</p>
          <p>4. Enter your API key and choose your preferred model</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/playground" className="flex-1">
          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            Configure in AI Console →
          </Button>
        </Link>
      </div>
    </div>
  );
}

function ConfigurationTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">Where to Configure LLM Providers</h3>
        <p className="text-slate-600 leading-relaxed">
          You can configure your LLM provider in multiple locations throughout the platform. 
          Here's a guide to all configuration points:
        </p>
      </div>

      <div className="space-y-4">
        {/* AI Console */}
        <div className="border border-blue-200 rounded-lg p-5 bg-blue-50">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-blue-900 text-lg mb-1">AI Console (Primary)</h4>
              <p className="text-sm text-blue-700 mb-3">
                The main location for provider selection and testing
              </p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-blue-800 ml-13">
            <p><strong>📍 Location:</strong> AI Console Page → Settings ⚙️ button (top right)</p>
            <p><strong>🔗 URL:</strong> <Link href="/playground" className="text-blue-600 hover:underline font-mono">/playground</Link></p>
            <p><strong>⚡ Features:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Select from Local Models, Google Gemini, or OpenRouter</li>
              <li>Configure API keys and model preferences</li>
              <li>Test connection with the "Test" button</li>
              <li>View connection status (Online/Offline)</li>
            </ul>
          </div>

          <Link href="/playground" className="mt-4 block">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Open AI Console →
            </Button>
          </Link>
        </div>

        {/* Code Review */}
        <div className="border border-slate-200 rounded-lg p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-900 text-lg mb-1">Code Review Page (Alternative)</h4>
              <p className="text-sm text-slate-600 mb-3">
                Also allows provider selection for code reviews
              </p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-slate-700 ml-13">
            <p><strong>📍 Location:</strong> Code Review Page → Settings</p>
            <p><strong>🔗 URL:</strong> <Link href="/review" className="text-blue-600 hover:underline font-mono">/review</Link></p>
          </div>

          <Link href="/review" className="mt-4 block">
            <Button variant="outline" className="w-full">
              Open Code Review →
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
        <p className="text-sm text-indigo-900">
          <strong>💡 Pro Tip:</strong> Use the <strong>Test</strong> button in the AI Console to verify 
          your connection is working. The status indicator shows if the backend is online.
        </p>
      </div>
    </div>
  );
}

function TroubleshootingTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">Testing & Troubleshooting</h3>
        <p className="text-slate-600 leading-relaxed">
          Having issues with your LLM provider? Here are common problems and solutions.
        </p>
      </div>

      <div className="space-y-4">
        {/* Backend Offline */}
        <div className="border border-red-200 rounded-lg p-5 bg-red-50">
          <h4 className="font-bold text-red-900 mb-2 flex items-center gap-2">
            <span>🔴</span> Backend Offline?
          </h4>
          <p className="text-sm text-red-800 mb-3">
            If you see the "Offline" status in the AI Console, the backend service is not running.
          </p>
          <div className="space-y-2 text-sm text-red-800">
            <p><strong>Solution:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Check the connection status at the top of the AI Console</li>
              <li>Click the "Test" button to manually verify the connection</li>
              <li>Ensure the backend service is running on your system</li>
              <li>Visit <Link href="/playground" className="text-red-600 hover:underline font-semibold">/playground</Link> and look for the status indicator</li>
            </ul>
          </div>
        </div>

        {/* Provider Not Working */}
        <div className="border border-amber-200 rounded-lg p-5 bg-amber-50">
          <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
            <span>⚠️</span> Provider Not Working?
          </h4>
          <p className="text-sm text-amber-800 mb-3">
            Selected a provider but not getting responses?
          </p>
          <div className="space-y-2 text-sm text-amber-800">
            <p><strong>Checklist:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Local Models:</strong> Ensure the AI engine is running locally</li>
              <li><strong>Google Gemini:</strong> Verify GCP credentials are configured</li>
              <li><strong>OpenRouter:</strong> Check that your API key is entered correctly</li>
              <li>Click "Test" button in AI Console to run a health check</li>
              <li>Check browser console for error messages</li>
            </ul>
          </div>
        </div>

        {/* API Keys */}
        <div className="border border-blue-200 rounded-lg p-5 bg-blue-50">
          <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <span>🔑</span> Need API Keys?
          </h4>
          <p className="text-sm text-blue-800 mb-3">
            Some providers require API keys to function.
          </p>
          <div className="space-y-2 text-sm text-blue-800">
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Local Models:</strong> ✓ No API key needed</li>
              <li><strong>Google Gemini:</strong> ⚙️ Requires GCP credentials setup</li>
              <li><strong>OpenRouter:</strong> 🔑 Requires API key from openrouter.ai</li>
            </ul>
            <p className="mt-3">
              Configure API keys in the <strong>Settings</strong> panel of the AI Console.
            </p>
          </div>
        </div>

        {/* Testing Connection */}
        <div className="border border-green-200 rounded-lg p-5 bg-green-50">
          <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
            <span>✅</span> How to Test Your Connection
          </h4>
          <div className="space-y-2 text-sm text-green-800">
            <p><strong>Step-by-step:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Go to <Link href="/playground" className="text-green-700 hover:underline font-semibold">AI Console (/playground)</Link></li>
              <li>Look for the connection status badge (top right)</li>
              <li>Click the "Test" button next to the status</li>
              <li>Wait for the health check to complete</li>
              <li>Status will show "Online" if successful, "Offline" if failed</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/playground" className="flex-1">
          <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
            Test Connection Now →
          </Button>
        </Link>
      </div>
    </div>
  );
}

// Helper component for provider summary cards
interface ProviderSummaryCardProps {
  emoji: string;
  name: string;
  description: string;
  color: 'blue' | 'orange' | 'purple';
}

function ProviderSummaryCard({ emoji, name, description, color }: ProviderSummaryCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    orange: 'bg-orange-50 border-orange-200',
    purple: 'bg-purple-50 border-purple-200',
  };

  return (
    <div className={`flex items-center gap-3 p-3 border rounded-lg ${colorClasses[color]}`}>
      <div className="text-2xl">{emoji}</div>
      <div className="flex-1">
        <h5 className="font-semibold text-slate-900">{name}</h5>
        <p className="text-xs text-slate-600">{description}</p>
      </div>
    </div>
  );
}
