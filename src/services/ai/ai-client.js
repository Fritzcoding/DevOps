"use strict";
/**
 * Unified AI Client - Gemini AI integration
 * Uses Google Generative AI (Gemini) for all AI operations
 * All responses must be valid JSON for safety and consistency.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiClient = void 0;
const generative_ai_1 = require("@google/generative-ai");
const AIRouter_1 = require("../ai-routing/AIRouter");
const AISettingsManager_1 = require("../ai-routing/AISettingsManager");
class AIClient {
    apiKey;
    client = null;
    model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    isApiKeyValid = false;
    constructor(apiKey) {
        const settings = AISettingsManager_1.aiSettingsManager.load();
        this.apiKey = this.normalizeApiKey(apiKey || settings.cloud.apiKey || process.env.OPENAI_API_KEY || '');
        this.model = settings.cloud.model || this.model;
        this.isApiKeyValid = Boolean(this.apiKey || settings.activeBackend === 'local');
    }
    initializeLegacyGeminiClient(apiKey) {
        this.apiKey = this.normalizeApiKey(apiKey ||
            process.env.GEMINI_API_KEY ||
            process.env.GOOGLE_API_KEY ||
            process.env.VITE_GEMINI_API_KEY ||
            '');
        if (!this.apiKey) {
            console.warn('⚠️ GEMINI_API_KEY not set. AI features will fail.');
            this.isApiKeyValid = false;
            return;
        }
        try {
            this.client = new generative_ai_1.GoogleGenerativeAI(this.apiKey);
            this.isApiKeyValid = true;
            console.log('✓ Gemini client initialized');
        }
        catch (error) {
            console.error('Failed to initialize Gemini client:', error);
            this.isApiKeyValid = false;
        }
    }
    normalizeApiKey(key) {
        return key.trim().replace(/^['"]|['"]$/g, '');
    }
    /**
     * Detect error type from error message
     */
    detectErrorType(errorMessage) {
        const lower = errorMessage.toLowerCase();
        if (lower.includes('api_key_invalid') || lower.includes('invalid api key') || lower.includes('401') || lower.includes('unauthorized')) {
            return 'API_KEY_INVALID';
        }
        if (lower.includes('quota') || lower.includes('rate_limit') || lower.includes('429') || lower.includes('too many requests')) {
            return 'RATE_LIMITED';
        }
        if (lower.includes('not found') || lower.includes('404')) {
            return 'MODEL_NOT_FOUND';
        }
        if (lower.includes('token') || lower.includes('context_length_exceeded') || lower.includes('400')) {
            return 'TOKEN_LIMIT';
        }
        if (lower.includes('network') || lower.includes('fetch') || lower.includes('econnrefused')) {
            return 'NETWORK';
        }
        return 'UNKNOWN';
    }
    /**
     * Generic request to Gemini API
     * Ensures response is valid JSON and parseable
     */
    async request(systemPrompt, userMessage, maxTokens = 2048) {
        const configuredSettings = AISettingsManager_1.aiSettingsManager.load();
        if (configuredSettings.activeBackend === 'cloud' && !configuredSettings.cloud.apiKey) {
            return {
                success: false,
                error: 'Cloud API key is not configured. Open AI Settings to add a key or switch to Local AI.',
                errorType: 'API_KEY_NOT_SET',
            };
        }
        try {
            const routed = await AIRouter_1.aiRouter.executePrompt(userMessage, {
                systemPrompt,
                maxTokens,
                temperature: 0.3,
            });
            const text = routed.text;
            let data;
            try {
                const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
                data = JSON.parse(cleaned);
            }
            catch {
                data = text;
            }
            return {
                success: true,
                data,
                tokens: {
                    input: 0,
                    output: 0,
                },
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const errorType = this.detectErrorType(message);
            console.error('AI router request failed:', message);
            return {
                success: false,
                error: message,
                errorType,
            };
        }
        if (!this.isApiKeyValid || !this.client || !this.apiKey) {
            return {
                success: false,
                error: 'API key not configured. Set GEMINI_API_KEY in .env.local',
                errorType: 'API_KEY_NOT_SET',
            };
        }
        try {
            const model = this.client.getGenerativeModel({
                model: this.model,
                systemInstruction: systemPrompt,
            });
            const result = await model.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: userMessage,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    maxOutputTokens: maxTokens,
                    temperature: 0.3,
                },
            });
            const response = result.response;
            const text = response.text();
            // Try to parse as JSON for structured responses
            let data;
            try {
                // Clean up markdown JSON fences if present
                const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
                data = JSON.parse(cleaned);
            }
            catch {
                // If not JSON, return raw text
                data = text;
            }
            return {
                success: true,
                data,
                tokens: {
                    input: result.response.usageMetadata?.promptTokenCount || 0,
                    output: result.response.usageMetadata?.candidatesTokenCount || 0,
                },
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const errorType = this.detectErrorType(message);
            console.error('Gemini API request failed:', message);
            return {
                success: false,
                error: message,
                errorType,
            };
        }
    }
    async requestText(systemPrompt, userMessage, maxTokens = 2048) {
        const configuredSettings = AISettingsManager_1.aiSettingsManager.load();
        if (configuredSettings.activeBackend === 'cloud' && !configuredSettings.cloud.apiKey) {
            return {
                success: false,
                error: 'Cloud API key is not configured. Open AI Settings to add a key or switch to Local AI.',
                errorType: 'API_KEY_NOT_SET',
            };
        }
        try {
            const routed = await AIRouter_1.aiRouter.executePrompt(userMessage, {
                systemPrompt,
                maxTokens,
                temperature: 0.45,
            });
            return {
                success: true,
                data: routed.text.trim(),
                tokens: {
                    input: 0,
                    output: 0,
                },
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const errorType = this.detectErrorType(message);
            console.error('AI chat request failed:', message);
            return {
                success: false,
                error: message,
                errorType,
            };
        }
    }
    /**
     * Code Fixer - AI mode (Gemini powered)
     */
    async fixCode(code, error, language = 'typescript') {
        const systemPrompt = `You are an expert code repair engine. You receive either an error message with code, or code flagged as broken.

ALWAYS respond with ONLY valid JSON in this exact format:
{
  "language": "typescript",
  "original_snippet": "the exact original code provided",
  "fixed_snippet": "the corrected code",
  "explanation": "One sentence explaining what was wrong and what was fixed.",
  "confidence": 0.95
}

Rules:
- Respond with ONLY JSON, no markdown backticks or explanation
- Preserve the user's code style exactly
- Do not add imports unless absolutely required
- If code cannot be fixed, set confidence to 0.0 and explain why in explanation field
- Use language field to indicate detected or specified language`;
        const userMessage = error
            ? `Error: ${error}\n\nCode (${language}):\n\`\`\`\n${code}\n\`\`\``
            : `Fix this ${language} code:\n\`\`\`\n${code}\n\`\`\``;
        return this.request(systemPrompt, userMessage, 1024);
    }
    async fixCodeWithContext(payload) {
        const systemPrompt = `You are an autonomous code-fixing agent. You may use project context to make targeted fixes.

ALWAYS respond with ONLY valid JSON:
{
  "summary": "short summary",
  "confidence": 0.0,
  "changes": [
    {
      "path": "relative/path.ts",
      "original": "exact original text to replace",
      "fixed": "replacement text",
      "explanation": "why this change fixes the issue",
      "confidence": 0.0
    }
  ],
  "warnings": []
}

Rules:
- Confidence must reflect evidence quality: exact error + exact file + local references is high; vague instructions or missing context is lower.
- Return exact original substrings that can be found in the file. Do not invent unrelated rewrites.
- For clipboard scope, omit path or set it to null.
- For file/codebase scope, every change must include a path from the provided context.
- Prefer small surgical patches over whole-file rewrites.
- If no safe fix is possible, return an empty changes array and confidence below 0.4.`;
        const userMessage = JSON.stringify(payload, null, 2);
        return this.request(systemPrompt, userMessage, 4096);
    }
    async organizeFilesWithInstruction(scan, instruction) {
        const systemPrompt = `You are a senior software architect organizing project files.

ALWAYS respond with ONLY valid JSON:
{
  "redundant_files": [
    { "path": "relative/path", "reason": "why it is redundant", "action": "ARCHIVE" }
  ],
  "moves": [
    { "from": "relative/source", "to": "relative/destination", "reason": "why this belongs there" }
  ],
  "new_dirs_to_create": ["relative/dir"],
  "summary": "short summary",
  "risk_level": "low"
}

Rules:
- Respect the user's sorting instruction.
- Never move lockfiles, package manager files, git files, env files, or build outputs unless explicitly requested.
- Use only relative paths present in the scan.
- Prefer professional, conventional structures for the detected stack.
- Mark risk_level high if imports or runtime paths probably need code updates.`;
        const userMessage = `Instruction:\n${instruction || 'Organize this project professionally.'}\n\nScan:\n${JSON.stringify(scan, null, 2)}`;
        return this.request(systemPrompt, userMessage, 4096);
    }
    async chatWithCodebase(message, context, history = []) {
        const systemPrompt = `You are DevOps Lite's codebase chat assistant.

Respond in plain text, not JSON.
Be conversational for greetings and general questions.
For codebase questions, answer directly with concrete file paths and implementation details from the provided context.
Keep answers concise by default: 1-4 short paragraphs or a short bullet list.
If the context is insufficient, say exactly what file or detail is missing.
Never describe the input as "this JSON object" or explain the schema of the context.`;
        const userMessage = `User message:
${message}

Recent conversation:
${history.slice(-8).map((item) => `${item.role}: ${item.content}`).join('\n') || 'None'}

Codebase context:
${JSON.stringify(context, null, 2)}`;
        return this.requestText(systemPrompt, userMessage, 2048);
    }
    /**
     * Manual hardcoded code fixer - no API calls
     * Uses regex patterns to fix common issues
     */
    async fixCodeManually(code, _language = 'typescript') {
        try {
            let fixed = code;
            let changes = [];
            // Common JavaScript/TypeScript fixes
            // Fix missing semicolons at end of statements
            const missingColons = fixed.match(/\)(?!\s*[,;:\)}\]])\r?\n/g);
            if (missingColons) {
                fixed = fixed.replace(/\)(?!\s*[,;:\)}\]])(\r?\n)/g, ');$1');
                changes.push('Added missing semicolons');
            }
            // Fix common typos: consol.log -> console.log
            if (fixed.includes('consol.log')) {
                fixed = fixed.replace(/consol\.log/g, 'console.log');
                changes.push('Fixed console.log typo');
            }
            if (fixed.includes('System.oot.')) {
                fixed = fixed.replace(/System\.oot\./g, 'System.out.');
                changes.push('Fixed System.out typo');
            }
            // Fix missing commas in function calls
            const beforeCommaFix = fixed;
            fixed = fixed.replace(/(\w+)\s*\(\s*(\w+)\s+(\w+)/g, '$1($2, $3');
            if (fixed !== beforeCommaFix) {
                changes.push('Fixed missing commas in function calls');
            }
            // Fix missing equals in assignments
            const beforeEqualsFix = fixed;
            fixed = fixed.replace(/const\s+(\w+)\s+(\w+)\s*=/g, 'const $1 = $2');
            fixed = fixed.replace(/const\s+(\w+)\s+([A-Za-z_$][\w$]*\s*\()/g, 'const $1 = $2');
            if (fixed !== beforeEqualsFix) {
                changes.push('Fixed missing equals in const assignment');
            }
            const beforeReturnSemicolons = fixed;
            fixed = fixed.replace(/^(\s*return\s+[^;\r\n{}]+)$/gm, '$1;');
            if (fixed !== beforeReturnSemicolons) {
                changes.push('Added missing return semicolons');
            }
            const beforeJavaStatementSemicolons = fixed;
            fixed = fixed.replace(/^(\s*System\.out\.[^;\r\n{}]+)$/gm, '$1;');
            fixed = fixed.replace(/^(\s*[A-Za-z_$][\w$<>\[\]]*\s+[A-Za-z_$][\w$]*\s*=\s*new\s+[^;\r\n{}]+)$/gm, '$1;');
            if (fixed !== beforeJavaStatementSemicolons) {
                changes.push('Added missing Java statement semicolons');
            }
            const beforeBlockRepair = fixed;
            fixed = this.closeObviousMissingFunctionBlocks(fixed);
            if (fixed !== beforeBlockRepair) {
                changes.push('Closed unterminated function blocks');
            }
            const openBraces = (fixed.match(/\{/g) || []).length;
            const closeBraces = (fixed.match(/\}/g) || []).length;
            if (openBraces > closeBraces) {
                fixed += '\n' + '}'.repeat(openBraces - closeBraces);
                changes.push(`Added ${openBraces - closeBraces} missing closing brace(s)`);
            }
            const explanation = changes.length > 0
                ? `Fixed ${changes.length} issue(s): ${changes.join(', ')}`
                : 'No obvious issues found. Code appears valid.';
            const confidence = changes.length > 0 ? 0.7 : 0.5;
            return {
                success: true,
                data: {
                    language: _language,
                    original_snippet: code,
                    fixed_snippet: fixed,
                    explanation,
                    confidence,
                },
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                error: `Manual fix failed: ${message}`,
                errorType: 'UNKNOWN',
            };
        }
    }
    closeObviousMissingFunctionBlocks(code) {
        const lines = code.split('\n');
        const repaired = [];
        let functionDepth = 0;
        let functionIndent = '';
        const count = (line, char) => (line.match(new RegExp(`\\${char}`, 'g')) || []).length;
        const startsNewTopLevelBlock = (line) => /^(?:export\s+)?(?:async\s+)?function\b|^(?:export\s+)?(?:public\s+)?class\b/.test(line);
        const startsTopLevelStatement = (line) => /^(?:const|let|var|console\.log|System\.out\.|[A-Za-z_$][\w$]*\()/.test(line);
        for (const line of lines) {
            const trimmed = line.trim();
            const indent = line.match(/^\s*/)?.[0] || '';
            const topLevel = indent.length === 0;
            if (functionDepth > 0 && topLevel && trimmed && (startsNewTopLevelBlock(trimmed) || startsTopLevelStatement(trimmed))) {
                repaired.push(`${functionIndent}}`);
                functionDepth = 0;
                functionIndent = '';
            }
            repaired.push(line);
            if (/^\s*(?:export\s+)?(?:async\s+)?function\b.*\{\s*$/.test(line)) {
                functionDepth = 1;
                functionIndent = indent;
            }
            else if (functionDepth > 0) {
                functionDepth += count(line, '{') - count(line, '}');
                if (functionDepth <= 0) {
                    functionDepth = 0;
                    functionIndent = '';
                }
            }
        }
        if (functionDepth > 0) {
            repaired.push(`${functionIndent}}`);
        }
        return repaired.join('\n');
    }
    /**
     * Environment Builder - analyzes project, returns setup steps
     */
    async analyzeEnvironment(projectScan) {
        const systemPrompt = `You are a development environment setup expert. You analyze project scans and recommend setup steps.

ALWAYS respond with ONLY valid JSON:
{
  "detected_type": "java-maven|node|python|rust|go|unknown",
  "missing_tools": ["tool1", "tool2"],
  "setup_steps": [
    {
      "step": 1,
      "description": "Install Maven",
      "command": "brew install maven",
      "platform": "mac",
      "required": true
    }
  ],
  "env_vars_needed": ["JAVA_HOME"],
  "estimated_minutes": 5,
  "summary": "Detailed summary of what needs to be set up"
}

Rules:
- Respond with ONLY JSON, no markdown backticks
- Platforms: "mac", "windows", "linux", "universal"
- Only recommend tools actually needed based on files present
- Be specific with commands for each platform
- Set estimated_minutes realistically`;
        const userMessage = `Analyze this project and recommend setup steps:\n${JSON.stringify(projectScan, null, 2)}`;
        return this.request(systemPrompt, userMessage, 2048);
    }
    /**
     * File Organizer - identifies redundancy and misplaced files
     */
    async analyzeFileOrganization(deepScan) {
        const systemPrompt = `You are a project file organization expert. Analyze file trees and identify redundancy.

ALWAYS respond with ONLY valid JSON:
{
  "redundant_files": [
    {
      "path": "src/Foo_backup.java",
      "reason": "Backup of Foo.java, obsolete",
      "action": "DELETE"
    }
  ],
  "moves": [
    {
      "from": "src/query.sql",
      "to": "src/main/resources/db/query.sql",
      "reason": "SQL files belong in resources"
    }
  ],
  "new_dirs_to_create": ["src/main/resources/db"],
  "summary": "Removed 2 files, moved 3 files. Organized into standard structure.",
  "risk_level": "low"
}

Rules:
- Respond with ONLY JSON, no markdown backticks
- Flag files with _backup, _old, _v2, _copy, _test_data suffixes as DELETE if canonical version exists
- Only flag definite redundancy, never guess
- risk_level: "low" (safe), "medium" (review), "high" (risky)
- Return empty arrays if no issues found`;
        const userMessage = `Analyze this file tree for redundancy and misorganization:\n${JSON.stringify(deepScan, null, 2)}`;
        return this.request(systemPrompt, userMessage, 3000);
    }
    /**
     * Update API key at runtime
     */
    setApiKey(key) {
        this.apiKey = this.normalizeApiKey(key);
        const settings = AISettingsManager_1.aiSettingsManager.load();
        AISettingsManager_1.aiSettingsManager.save({
            cloud: {
                ...settings.cloud,
                apiKey: this.apiKey,
            },
            activeBackend: 'cloud',
            backendSelection: 'cloud',
            firstLaunchComplete: true,
        });
        try {
            this.client = new generative_ai_1.GoogleGenerativeAI(this.apiKey);
            this.isApiKeyValid = true;
            console.log('✓ Gemini client re-initialized');
        }
        catch (error) {
            console.error('Failed to reinitialize Gemini client:', error);
            this.isApiKeyValid = false;
        }
    }
    /**
     * Check if API key is configured and valid
     */
    hasApiKey() {
        return Boolean(AISettingsManager_1.aiSettingsManager.load().cloud.apiKey);
        return this.isApiKeyValid && Boolean(this.apiKey) && Boolean(this.client);
    }
    /**
     * Get API key validity status - differentiate between not set and invalid
     */
    getApiKeyStatus() {
        const settings = AISettingsManager_1.aiSettingsManager.load();
        if (!settings.cloud.apiKey) {
            return { isSet: false, isValid: false, status: 'NOT_SET' };
        }
        return { isSet: true, isValid: true, status: 'VALID' };
        if (!this.apiKey) {
            return { isSet: false, isValid: false, status: 'NOT_SET' };
        }
        if (!this.isApiKeyValid) {
            return { isSet: true, isValid: false, status: 'INVALID' };
        }
        return { isSet: true, isValid: true, status: 'VALID' };
    }
}
exports.aiClient = new AIClient();
