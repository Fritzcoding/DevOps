/**
 * Comprehensive help content for DevOps Lite
 * Structured for easy access and display in help modals
 */

export interface HelpStep {
  title: string;
  description: string;
  example?: string;
  tips?: string[];
}

export interface FeatureHelp {
  title: string;
  shortDescription: string;
  fullDescription: string;
  steps: HelpStep[];
  limitations?: string[];
  troubleshooting?: { issue: string; solution: string }[];
  shortcut?: string;
}

export interface HotkeyReference {
  key: string;
  action: string;
  feature: string;
  global?: boolean;
}

export const helpContent = {
  features: {
    'code-fixer': {
      title: 'Code Fixer',
      shortDescription: 'Auto-fix bugs & optimize code',
      fullDescription:
        'Use AI-powered code analysis to find and fix bugs, optimize performance, and improve code quality. Enter your code or paste snippets, describe issues, and get instant fixes.',
      steps: [
        {
          title: 'Step 1: Set Your Project Path',
          description:
            'Click "Current" in the Feature Menu to auto-detect your project, or manually enter the project folder path. This helps the fixer understand your codebase context.',
          example: '/Users/myname/projects/myapp or C:\\Users\\myname\\projects\\myapp',
          tips: [
            'The path should be the root directory of your project',
            'Ensure you have read permissions to the project folder',
            'Works with Node.js, Python, Java, and other popular languages',
          ],
        },
        {
          title: 'Step 2: Paste Code',
          description:
            'Paste the code snippet or function you want to fix into the code editor. Start with small, focused pieces of code for better results.',
          example:
            'function calculateTotal(items) {\n  let total = 0;\n  for (let i = 0; i < items.length; i++) {\n    total = total + items[i];\n  }\n  return total;\n}',
          tips: [
            'Select the language (JavaScript, Python, Java, etc.)',
            'Keep snippets under 500 lines for faster processing',
            'Include error messages if you\'re fixing a bug',
          ],
        },
        {
          title: 'Step 3: Describe the Issue',
          description:
            'In the chat box, explain what you want: "Fix performance issue", "Remove duplicate code", "Add error handling", etc.',
          example: 'This function is slow with large arrays. Can you optimize it?',
          tips: [
            'Be specific about what you want improved',
            'Mention performance, security, readability, or style concerns',
            'Include any constraints (e.g., "must stay under 50ms")',
          ],
        },
        {
          title: 'Step 4: Review the Fix',
          description:
            'The AI will suggest fixes. Review the changes, understand the improvements, and apply them to your code.',
          example: 'The fixed code uses Array.reduce() for cleaner, faster iteration',
          tips: [
            'Ask follow-up questions if you don\'t understand changes',
            'Test the fixed code in your project before committing',
            'Use "Quick Fix" for instant common optimizations',
          ],
        },
      ],
      limitations: [
        'Works best with single functions or small modules',
        'May require clarification for complex architectural changes',
        'Requires internet connection for AI processing',
      ],
      troubleshooting: [
        {
          issue: 'Code Fixer says "Invalid code"',
          solution:
            'Ensure your code is syntactically correct. Paste a complete, runnable code snippet. If it\'s partial code, wrap it in a function.',
        },
        {
          issue: 'Suggestions don\'t match my coding style',
          solution:
            'Clarify your preferences: "Use only ES5 syntax", "Keep it functional style", "Use lodash for utilities", etc.',
        },
        {
          issue: 'Takes too long to respond',
          solution:
            'Paste smaller code snippets (under 100 lines). Large files slow down analysis.',
        },
      ],
      shortcut: 'Ctrl+Alt+C',
    },

    environment: {
      title: 'Environment Builder',
      shortDescription: 'Setup & detect environments',
      fullDescription:
        'Automatically detect and set up your development environment. Installs Node.js, Python, Java, and other required tools based on your project needs.',
      steps: [
        {
          title: 'Step 1: Open Environment Builder',
          description:
            'Click the Environment Builder button or press Ctrl+Alt+E. The tool will scan your project for requirements.',
          tips: [
            'Works with Node.js, Python, Java, .NET, Go, and Rust projects',
            'Reads package.json, requirements.txt, pom.xml, go.mod, etc.',
          ],
        },
        {
          title: 'Step 2: Review Detected Environments',
          description:
            'The builder shows what runtimes/frameworks it found: Node.js v18, Python 3.9, Java 11, etc. Check the versions.',
          example:
            'Detected: Node.js 18.0.0, npm 8.0.0, Python 3.9, Java 11.0',
          tips: [
            'If versions are outdated, the tool can auto-update them',
            'Pin specific versions for team consistency',
          ],
        },
        {
          title: 'Step 3: Choose Setup Mode',
          description:
            'Pick "Auto Setup" (install everything) or "Custom" setup (select which tools to install).',
          tips: [
            'Auto Setup is fastest for new machines',
            'Custom mode is better for CI/CD or restricted environments',
          ],
        },
        {
          title: 'Step 4: Wait for Installation',
          description:
            'The tool installs and configures everything. This may take 5-15 minutes depending on what\'s needed. Watch the progress in the logs.',
          tips: [
            'Requires admin/sudo permissions for system tools',
            'You\'ll be prompted for permission if needed',
            'Check the log for any errors during installation',
          ],
        },
        {
          title: 'Step 5: Verify',
          description:
            'After setup, the tool runs verification: `node --version`, `python --version`, `java -version`, etc. Green checkmarks = ready!',
          tips: ['If verification fails, check the error logs for details'],
        },
      ],
      limitations: [
        'Requires internet to download tools',
        'May need admin/sudo permissions',
        'Some tools are OS-specific (e.g., certain frameworks on Windows)',
        'Doesn\'t configure IDE plugins or extensions',
      ],
      troubleshooting: [
        {
          issue: 'Installation fails - permission denied',
          solution:
            'Run DevOps Lite with admin/sudo privileges. On Mac/Linux: use `sudo`. On Windows: run cmd as Administrator.',
        },
        {
          issue: 'Verification shows "Tool not found" after installation',
          solution:
            'Try restarting your terminal or computer. Sometimes PATH needs to refresh. Or manually verify: `node --version` in a terminal.',
        },
        {
          issue: 'Project still doesn\'t run after setup',
          solution:
            'Review the setup logs for warnings. Some projects need additional config (e.g., database setup, API keys). Check the project README.',
        },
      ],
      shortcut: 'Ctrl+Alt+E',
    },

    organizer: {
      title: 'File Organizer',
      shortDescription: 'Reorganize project files',
      fullDescription:
        'Automatically organize project files into a clean, maintainable structure. Choose professional templates or create custom organization rules.',
      steps: [
        {
          title: 'Step 1: Choose Organization Mode',
          description:
            'Select "Professional" for a standard project structure, or "Custom" to define your own rules.',
          tips: [
            'Professional: Standard src/, tests/, docs/, config/ structure',
            'Custom: Define your own folder layout and naming conventions',
          ],
        },
        {
          title: 'Step 2: Professional Template (Optional)',
          description:
            'If using Professional mode, select your project type: React App, Node.js API, Python Package, etc. Each has a pre-defined structure.',
          example:
            'React Project: src/ → components/, pages/, hooks/, utils/, styles/; public/; tests/',
          tips: [
            'Templates are based on industry best practices',
            'You can modify after organization is applied',
          ],
        },
        {
          title: 'Step 3: Custom Organization (If Needed)',
          description:
            'For Custom mode, describe your desired structure in natural language. Example: "Put all utils in src/lib, tests in __tests__ folder, configs in config/ root"',
          example:
            'src/ → services/, components/, hooks/; tests/ → unit/, integration/, e2e/; .config/ for configs',
          tips: [
            'Be specific about folder depth and naming',
            'Mention file type routing if relevant (e.g., "*.test.js files go to tests/")',
          ],
        },
        {
          title: 'Step 4: Review Proposed Changes',
          description:
            'The tool shows what files will move where. Review and confirm before applying.',
          tips: [
            'Check for any files that won\'t be moved (usually ignored files like .git)',
            'Confirm no important files are affected',
          ],
        },
        {
          title: 'Step 5: Apply Organization',
          description:
            'Click "Apply" to reorganize files. The tool updates import paths automatically to prevent breakage.',
          tips: [
            'Backups are created before changes',
            'Test your project after organization to ensure everything works',
            'Commit to git before organization for easy rollback',
          ],
        },
      ],
      limitations: [
        'May not handle circular imports after reorganization',
        'Complex build systems might need manual tweaks',
        'Some third-party imports may break (check after reorganization)',
        'Works best with non-compiled languages or build tools that support path mapping',
      ],
      troubleshooting: [
        {
          issue: 'Project breaks after reorganization',
          solution:
            'All imports should be auto-updated, but if some fail: 1) Git diff to see changes, 2) Manually fix remaining imports, 3) Use git undo if too complex.',
        },
        {
          issue: 'Tool says "Can\'t move file - permission denied"',
          solution:
            'Close your IDE or any tools using those files, then retry. Some editors lock files during editing.',
        },
        {
          issue: 'Backups weren\'t created',
          solution:
            'Manually create git commits before organizing. DevOps Lite backups are stored in .devops-lite-backups/.',
        },
      ],
      shortcut: 'Ctrl+Alt+O',
    },
  },

  globalShortcuts: [
    {
      key: 'Ctrl+Alt+C',
      action: 'Open Code Fixer',
      feature: 'code-fixer',
      global: true,
    },
    {
      key: 'Ctrl+Alt+E',
      action: 'Open Environment Builder',
      feature: 'environment',
      global: true,
    },
    {
      key: 'Ctrl+Alt+O',
      action: 'Open File Organizer',
      feature: 'organizer',
      global: true,
    },
    {
      key: 'Ctrl+Shift+D',
      action: 'Toggle Debug Panel',
      feature: 'debug',
      global: true,
    },
  ],

  inAppShortcuts: {
    'code-fixer': [
      { key: 'Ctrl+Enter', action: 'Send message to AI' },
      { key: 'Esc', action: 'Close modal' },
      { key: '?', action: 'Show keyboard shortcuts' },
    ],
    environment: [
      { key: 'Ctrl+R', action: 'Restart detection' },
      { key: 'Esc', action: 'Close modal' },
      { key: '?', action: 'Show keyboard shortcuts' },
    ],
    organizer: [
      { key: 'Ctrl+Z', action: 'Undo organization' },
      { key: 'Esc', action: 'Close modal' },
      { key: '?', action: 'Show keyboard shortcuts' },
    ],
  },

  gettingStarted: {
    title: 'Getting Started',
    content: `
Welcome to DevOps Lite! Here's the quickest way to get started:

1. **See the Shimeji** - The floating icon in the top-right corner (or wherever you dragged it). That's your entry point to everything.

2. **Click the Shimeji** - Brings up the Feature Menu showing your 3 tools:
   - Code Fixer (fix bugs, improve code)
   - Environment Builder (setup your dev environment)
   - File Organizer (clean up your project structure)

3. **Pick a Feature** - Click one to open it. Each feature opens in a clean modal.

4. **Use Your Keyboard** - All features have global hotkeys:
   - Ctrl+Alt+C → Code Fixer
   - Ctrl+Alt+E → Environment Builder
   - Ctrl+Alt+O → File Organizer

5. **Get Help** - Click "Help & Shortcuts" from the Feature Menu, or right-click the Shimeji.

6. **Enable Debug** - Press Ctrl+Shift+D to see live logs while using features (useful if something breaks).

That's it! Start with one feature and explore.
    `,
  },

  faq: [
    {
      question: 'How do I change the project folder?',
      answer:
        'Click "Change Path" in the Feature Menu, or it auto-detects on startup. You can manually enter a path if detection fails.',
    },
    {
      question: 'Can I use all 3 features at the same time?',
      answer:
        'Not recommended. Each feature uses system resources (especially Environment Builder). Run them one at a time to avoid conflicts.',
    },
    {
      question: 'Does it work offline?',
      answer:
        'Code Fixer requires internet (AI backend). Environment Builder and File Organizer work offline.',
    },
    {
      question: 'Is my code safe? Is it sent to a server?',
      answer:
        'Code Fixer sends code to an AI backend for analysis. No code is stored permanently. For enterprise, you can self-host the backend.',
    },
    {
      question: 'What if something breaks?',
      answer:
        'All changes create backups first. Check .devops-lite-backups/ for rollbacks. Enable Debug Panel (Ctrl+Shift+D) to see what happened.',
    },
    {
      question: 'Can I minimize the Shimeji?',
      answer:
        'Right-click the Shimeji → "Minimize to Tray" to hide it. Click the system tray icon to restore it.',
    },
  ],
};

export default helpContent;
