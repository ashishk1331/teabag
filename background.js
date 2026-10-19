/**
 * Teabag - Background Service Worker
 * Powered by OpenRouter Decisions API (https://openrouter.ai/api/alpha/decisions)
 * Model: inception/mercury-decide:free (choice, noul, and score questions)
 */

// Hardcoded API key for personal use (or configure via extension popup)
const HARDCODED_OPENROUTER_API_KEY = "YOUR_OPENROUTER_API_KEY";
const DEFAULT_MODEL = "inception/mercury-decide:free";
const DECISIONS_ENDPOINT = "https://openrouter.ai/api/alpha/decisions";

/**
 * Approach paradigms offered to the paradigm choice questions (key -> description).
 */
const APPROACH_CRITERIA = {
  brute_force: "Checks all possibilities without a more refined technique.",
  two_pointers: "Two indices moving through the data, in parallel or from both ends.",
  sliding_window: "A moving window over a sequence tracking a contiguous range.",
  hash_table: "Hashing values for constant-time lookup or counting.",
  prefix_sum: "Precomputed running totals for fast range queries.",
  binary_search: "Halving the search space on sorted or monotonic data.",
  sorting: "Sorting the input first to simplify the remaining work.",
  stack: "A last-in-first-out structure for nesting or matching.",
  monotonic_stack: "A stack kept monotonic to find next greater or smaller elements.",
  queue: "A first-in-first-out structure or deque for ordered processing.",
  linked_list: "Pointer manipulation over linked nodes.",
  tree_traversal: "Recursive or iterative traversal of a tree.",
  bst: "Using binary-search-tree ordering properties.",
  heap: "A priority queue for repeated minimum or maximum extraction.",
  graph_search: "Breadth-first or depth-first traversal of a graph or grid.",
  shortest_path: "Shortest-path search such as Dijkstra, Bellman-Ford, or Floyd-Warshall.",
  topological_sort: "Ordering nodes by their dependencies.",
  union_find: "Disjoint-set union for connectivity queries.",
  trie: "A prefix tree for efficient string lookups.",
  dynamic_programming: "Building up answers from overlapping subproblems.",
  memoization: "Top-down caching of recursive results.",
  greedy: "Locally optimal choices that lead to the global optimum.",
  backtracking: "Exploring candidates and undoing choices that fail.",
  divide_and_conquer: "Splitting into independent subproblems and merging results.",
  bit_manipulation: "Bit operations and bitmasks.",
  math: "Direct mathematical or number-theoretic reasoning.",
  simulation: "Simulating the process step by step.",
  intervals: "Merging, sweeping, or scheduling over ranges.",
  matrix: "Row or column traversal and manipulation of a 2D grid.",
  other: "Another paradigm not listed above."
};

/**
 * Big-O complexity choices shared by the time and space questions.
 */
const COMPLEXITY_CRITERIA = {
  o_1: "O(1) — constant.",
  o_log_n: "O(log n) — logarithmic.",
  o_n: "O(n) — linear.",
  o_n_log_n: "O(n log n) — linearithmic.",
  o_n_2: "O(n^2) — quadratic.",
  o_n_3: "O(n^3) — cubic.",
  o_2_n: "O(2^n) — exponential.",
  o_n_factorial: "O(n!) — factorial."
};

/**
 * Display labels for answer keys that don't title-case cleanly.
 */
const LABELS = {
  bst: "Binary Search Tree",
  o_1: "O(1)",
  o_log_n: "O(log n)",
  o_n: "O(n)",
  o_n_log_n: "O(n log n)",
  o_n_2: "O(n²)",
  o_n_3: "O(n³)",
  o_2_n: "O(2ⁿ)",
  o_n_factorial: "O(n!)"
};

function labelFor(key, fallback) {
  if (!key) return fallback;
  if (LABELS[key]) return LABELS[key];
  return String(key)
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Retrieves the active API key from storage, falling back to the hardcoded default.
 * The model is fixed to Inception Mercury Decide (free).
 */
async function getConfig() {
  const syncData = await chrome.storage.local.get(["openrouter_api_key"]);
  const apiKey = (syncData.openrouter_api_key && syncData.openrouter_api_key.trim().length > 0)
    ? syncData.openrouter_api_key.trim()
    : HARDCODED_OPENROUTER_API_KEY;

  return { apiKey, model: DEFAULT_MODEL };
}

/**
 * Mercury Decide reads a JSON `state` of related context. We pass the problem
 * statement and the submitted code as clearly named fields.
 */
function buildSubmissionState({ problemTitle, problemSlug, problemDescription, code, language }) {
  return {
    problem: {
      title: problemTitle || problemSlug || "LeetCode Problem",
      slug: problemSlug || "unknown",
      description: problemDescription
        ? problemDescription.slice(0, 3500)
        : "Evaluate based on the submitted code."
    },
    submission: {
      language: language || "unknown",
      code: code || ""
    }
  };
}

/**
 * The Decisions question set: choice questions return real labels (paradigm,
 * complexities), score rates overall code quality, and noul questions answer
 * the yes/no properties behind the optimality flags.
 */
function buildQuestions() {
  return {
    approach: {
      type: "choice",
      instructions: "Which algorithmic paradigm does the submitted code use to solve the problem?",
      criteria: APPROACH_CRITERIA
    },
    optimal_approach: {
      type: "choice",
      instructions: "Which algorithmic paradigm is best suited to solve this problem optimally?",
      criteria: APPROACH_CRITERIA
    },
    approach_is_optimal: {
      type: "noul",
      instructions: "Does the submitted code already use the optimal algorithmic paradigm for this problem?"
    },
    time_complexity: {
      type: "choice",
      instructions: "What is the Big-O time complexity of the submitted code?",
      criteria: COMPLEXITY_CRITERIA
    },
    optimal_time_complexity: {
      type: "choice",
      instructions: "What is the best achievable Big-O time complexity for this problem?",
      criteria: COMPLEXITY_CRITERIA
    },
    space_complexity: {
      type: "choice",
      instructions: "What is the Big-O auxiliary space complexity of the submitted code?",
      criteria: COMPLEXITY_CRITERIA
    },
    efficiency_is_optimal: {
      type: "noul",
      instructions: "Does the submitted code achieve the best achievable time complexity for this problem?"
    },
    code_quality: {
      type: "score",
      instructions: "Rate the overall quality of the submitted code: readability, structure, and style.",
      criteria: ["Poor", "Fair", "Good", "Excellent"]
    },
    naming_is_clear: {
      type: "noul",
      instructions: "Are the names of variables, functions, and classes clear and descriptive?"
    },
    code_is_structured: {
      type: "noul",
      instructions: "Is the code well-structured, with logic broken into focused, readable sections?"
    },
    code_is_idiomatic: {
      type: "noul",
      instructions: "Does the code follow idiomatic conventions for its programming language?"
    }
  };
}

/**
 * Call the OpenRouter Decisions API (/api/alpha/decisions) with
 * inception/mercury-decide:free and map answers onto Teabag's decision schema.
 */
async function callDecisionsAPI(apiKey, submission, signal) {
  const payload = {
    model: DEFAULT_MODEL,
    state: buildSubmissionState(submission),
    questions: buildQuestions()
  };

  const response = await fetch(DECISIONS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "https://leetcode.com",
      "X-Title": "Teabag LeetCode AI Analyzer"
    },
    body: JSON.stringify(payload),
    signal
  });

  if (!response.ok) {
    let errText = await response.text().catch(() => "");
    try {
      const errJson = JSON.parse(errText);
      errText = errJson.error?.message || errText;
    } catch (_) {}
    throw new Error(`Decisions API error (${response.status}): ${errText || response.statusText}`);
  }

  const result = await response.json();
  const answers = result.answers || {};
  const answer = (id) => answers[id] || {};
  const pct = (value, fallback) => Math.round((value ?? fallback) * 100);

  // Approach: choice label + suggested paradigm + noul optimality flag
  const currentApproach = labelFor(answer("approach").choice, "Algorithmic Pattern");
  const suggestedApproach = labelFor(answer("optimal_approach").choice, currentApproach);
  const isApproachOpt = (answer("approach_is_optimal").noul ?? 1) >= 0.5;
  const approachConf = pct(answer("approach").confidence, 0.85);

  // Efficiency: time/space complexity choices + noul optimality flag
  const currentTime = labelFor(answer("time_complexity").choice, "N/A");
  const optimalTime = labelFor(answer("optimal_time_complexity").choice, currentTime);
  const currentSpace = labelFor(answer("space_complexity").choice, "N/A");
  const isEffOpt = (answer("efficiency_is_optimal").noul ?? 1) >= 0.5;
  const effConf = pct(answer("time_complexity").confidence, 0.85);

  // Code style: score (0-3 across Poor/Fair/Good/Excellent) + noul traits
  const quality = answer("code_quality");
  const qualityScore = typeof quality.score === "number" ? quality.score : 1.5;
  const styleRank = qualityScore >= 2.5 ? "EXCELLENT"
    : (qualityScore >= 1.5 ? "GOOD" : (qualityScore >= 0.5 ? "FAIR" : "POOR"));
  const styleConf = pct(quality.confidence, qualityScore / 3);

  const language = submission.language || "the language";
  const strengths = [];
  const improvements = [];
  if ((answer("naming_is_clear").noul ?? 1) >= 0.6) {
    strengths.push("Clear, descriptive naming");
  } else {
    improvements.push("Tighten variable, function, and class naming");
  }
  if ((answer("code_is_structured").noul ?? 1) >= 0.6) {
    strengths.push("Well-structured, readable control flow");
  } else {
    improvements.push("Break the logic into smaller, focused sections");
  }
  if ((answer("code_is_idiomatic").noul ?? 1) >= 0.6) {
    strengths.push(`Idiomatic ${language} conventions`);
  } else {
    improvements.push(`Follow common ${language} idioms and conventions`);
  }

  return {
    model: DEFAULT_MODEL,
    approach: {
      current: currentApproach,
      suggested: suggestedApproach,
      is_optimal: isApproachOpt,
      confidence: approachConf,
      probabilities: answer("approach").probabilities || null,
      rationale: isApproachOpt
        ? `Submitted solution uses ${currentApproach}, the optimal paradigm for this problem.`
        : `Submitted solution uses ${currentApproach}; a ${suggestedApproach} approach fits this problem better.`
    },
    efficiency: {
      current_time: currentTime,
      optimal_time: optimalTime,
      current_space: currentSpace,
      is_optimal: isEffOpt,
      confidence: effConf,
      probabilities: answer("time_complexity").probabilities || null,
      explanation: `Runs in ${currentTime} with ${currentSpace} auxiliary space; the best achievable time complexity is ${optimalTime}.`
    },
    code_style: {
      rank: styleRank,
      confidence: styleConf,
      probabilities: quality.probabilities || null,
      summary: `Code quality rated ${styleRank} (${styleConf}% confidence).`,
      strengths,
      improvements
    },
    raw_decisions: result
  };
}

/**
 * Handle streaming connection from content script
 */
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "teabag-analysis-stream") return;

  let abortController = null;

  port.onMessage.addListener(async (msg) => {
    if (msg.action === "analyze") {
      const { problemTitle, problemSlug, problemDescription, code, language } = msg.payload || {};

      abortController = new AbortController();

      try {
        const { apiKey, model } = await getConfig();

        if (!apiKey || apiKey === "YOUR_OPENROUTER_API_KEY") {
          port.postMessage({
            type: "error",
            error: "OpenRouter API Key not configured. Please set your key in the extension popup or background.js."
          });
          return;
        }

        port.postMessage({ type: "status", status: `Evaluating decisions via ${model}...` });

        const submission = {
          problemTitle,
          problemSlug,
          problemDescription,
          code,
          language
        };

        // OpenRouter Decisions API is the only inference path: the model runs
        // as a decision router, never as a chat completion.
        const decisionData = await callDecisionsAPI(apiKey, submission, abortController.signal);

        port.postMessage({
          type: "done",
          decisionData: decisionData,
          fullText: JSON.stringify(decisionData)
        });
        return;
      } catch (err) {
        if (err.name === "AbortError") {
          port.postMessage({ type: "aborted" });
        } else {
          console.error("[Teabag] Analysis failed:", err);
          port.postMessage({
            type: "error",
            error: err.message || "Failed to analyze submission."
          });
        }
      }
    }
  });

  port.onDisconnect.addListener(() => {
    if (abortController) {
      abortController.abort();
    }
  });
});

// Simple message listener for testing key or queries
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "get_config") {
    getConfig().then(cfg => sendResponse(cfg));
    return true;
  }
  if (request.action === "save_config") {
    chrome.storage.local.set({
      openrouter_api_key: request.apiKey
    }).then(() => sendResponse({ success: true }));
    return true;
  }
});
