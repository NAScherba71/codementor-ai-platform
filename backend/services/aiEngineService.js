/**
 * AI Engine Service
 * Wraps the Python AI Engine HTTP API for code analysis and context management
 */

const axios = require('axios');

class AIEngineService {
  constructor() {
    this.aiEngineUrl = process.env.AI_ENGINE_URL || process.env.PYTHON_AI_ENGINE_URL || 'http://localhost:5000';
    this.personality = 'encouraging';
    this.context = {
      current_topic: 'general programming',
      skill_level: 'beginner',
      language: 'python'
    };
  }

  /**
   * Analyze code using the Python AI Engine
   * @param {string} code - The code to analyze
   * @param {string} language - Programming language
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeCode(code, language) {
    try {
      const response = await axios.post(`${this.aiEngineUrl}/code/analyze`, {
        code,
        language,
        challengeContext: null
      });

      return response.data.analysis || response.data;
    } catch (error) {
      console.error('AI Engine code analysis error:', error.message);
      // Return fallback analysis
      return this._fallbackAnalysis(code, language);
    }
  }

  /**
   * Set the tutor personality
   * @param {string} personality - The personality type
   */
  setPersonality(personality) {
    const validPersonalities = ['encouraging', 'analytical', 'creative', 'practical'];
    if (validPersonalities.includes(personality)) {
      this.personality = personality;
    }
  }

  /**
   * Set a context value
   * @param {string} key - Context key
   * @param {any} value - Context value
   * @returns {boolean} Success status
   */
  setContext(key, value) {
    const validKeys = ['current_topic', 'skill_level', 'language'];
    if (!validKeys.includes(key)) {
      return false;
    }
    this.context[key] = value;
    return true;
  }

  /**
   * Get the current context
   * @returns {Object} Current context
   */
  getContext() {
    return { ...this.context };
  }

  /**
   * Fallback analysis when AI Engine is unavailable
   * @private
   */
  _fallbackAnalysis(code, language) {
    return {
      syntax_errors: [],
      code_quality: {
        readability_score: 0.7,
        complexity_score: 0.5,
        maintainability_score: 0.6
      },
      performance: {
        time_complexity: 'Unknown',
        space_complexity: 'Unknown',
        optimization_opportunities: []
      },
      best_practices: [],
      suggestions: ['Connect to AI Engine for detailed analysis'],
      ai_insights: {
        ai_analysis: 'AI analysis unavailable - using fallback analysis',
        confidence: 0.0,
        model_used: 'fallback'
      }
    };
  }
}

module.exports = AIEngineService;
