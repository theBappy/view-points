const PISTON_API = "https://emkc.org/api/v2/piston";

/**
 * Supported language configurations with their latest stable versions
 * You can check updated versions here:
 * https://emkc.org/api/v2/piston/runtimes
 */
const LANGUAGE_VERSIONS = {
  javascript: { language: "javascript", version: "18.15.0" },
  python: { language: "python", version: "3.10.0" },
  java: { language: "java", version: "15.0.2" },
  c: { language: "c", version: "10.2.0" },
  cpp: { language: "cpp", version: "10.2.0" },
  go: { language: "go", version: "1.19.2" },
};

/**
 * Executes code using the Piston API
 * @param {string} language - One of the supported languages (e.g. 'python', 'javascript')
 * @param {string} code - The code to execute
 * @param {string} [userInput] - Optional input to pass to stdin
 * @returns {Promise<{success: boolean, output?: string, error?: string}>}
 */
export async function executeCode(language, code, userInput = "") {
  try {
    const languageConfig = LANGUAGE_VERSIONS[language];
    if (!languageConfig) {
      return { success: false, error: `Unsupported language: ${language}` };
    }

    // Timeout controller to avoid hanging requests
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s limit

    const response = await fetch(`${PISTON_API}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: languageConfig.language,
        version: languageConfig.version,
        files: [
          {
            name: `main.${getFileExtension(language)}`,
            content: code,
          },
        ],
        stdin: userInput,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { success: false, error: `HTTP error: ${response.status}` };
    }

    const data = await response.json();

    if (!data.run) {
      return { success: false, error: "No run data returned from API" };
    }

    const output = (data.run.output || "").trim();
    const stderr = (data.run.stderr || "").trim();

    if (stderr) {
      return { success: false, output, error: stderr };
    }

    return { success: true, output: output || "No output" };
  } catch (error) {
    return { success: false, error: `Execution failed: ${error.message}` };
  }
}

/**
 * Maps languages to their respective file extensions
 */
function getFileExtension(language) {
  const extensions = {
    javascript: "js",
    python: "py",
    java: "java",
    c: "c",
    cpp: "cpp",
    go: "go",
  };
  return extensions[language] || "txt";
}
