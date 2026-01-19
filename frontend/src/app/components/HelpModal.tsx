'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Brain, Code, BookOpen, Target, Trophy } from 'lucide-react';
import { Button } from './ui/button';
import { useEffect } from 'react';

interface HelpModalProps {
  show: boolean;
  onClose: () => void;
}

export function HelpModal({ show, onClose }: HelpModalProps) {
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

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl m-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5 text-slate-500" />
              </Button>
            </div>

            <div className="p-8 sm:p-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Welcome to CodeMentor!</h2>
                  <p className="text-slate-500">Your personal AI assistant for learning programming.</p>
                </div>
              </div>

              <div className="text-slate-600 space-y-4">
                <p>
                  This platform is created to help you become a better engineer, not just write code. 
                  Here's what you can do here:
                </p>
                <ul className="space-y-5 my-6">
                  <li className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">AI Mentorship</h4>
                      <p className="text-sm">
                        Start learning from scratch. The AI tutor adapts to your pace and helps you master new technologies.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">"Strict" Code Review (Hard Code Review)</h4>
                      <p className="text-sm">
                        Get honest and rigorous feedback on your code, just like from a senior developer. Find inconsistencies and bad practices.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Code className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">Interactive Sandbox</h4>
                      <p className="text-sm">
                        Write code directly in the browser and get intelligent AI analysis. Experiment without fear of making mistakes.
                      </p>
                    </div>
                  </li>
                </ul>
                <p>
                  Start by selecting one of the modes on the main page or go to your profile to see your learning path. Good luck!
                </p>
              </div>

              <div className="mt-8 text-right">
                <Button 
                  onClick={onClose}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  Got it, thanks!
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
