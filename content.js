/**
 * Teabag - LeetCode AI Submission Analyzer
 * Content Script: DOM detection, API communication, card state and event management.
 * Templates and Icons are delegated to templates.js and icons.js.
 */

(() => {
  const { WAVES_SVG, CHECK_SVG, SPINNER_SVG } = window.TeabagIcons || {};
  const {
    renderStepHtml,
    renderLoadingHtml,
    renderErrorHtml,
    buildMarkdownSummary
  } = window.TeabagTemplates || {};

  const CACHE_PREFIX = "teabag_cache_v2_";

  let isAnalyzing = false;
  let activePort = null;
  let currentDecisionData = null;
  let activeStep = 0; // 0: Approach, 1: Efficiency, 2: Code Style
  let lastSubmissionKey = null;

  function getProblemSlug() {
    const match = window.location.pathname.match(/\/problems\/([^/]+)/);
    return match ? match[1] : null;
  }

  function getProblemMeta() {
    const slug = getProblemSlug();
    const title = document.title.replace(/\s*-\s*LeetCode\s*$/, "").trim();
    return {
      title: title || slug || "",
      url: slug ? `https://leetcode.com/problems/${slug}/` : window.location.href
    };
  }

  function getSubmissionId() {
    const match = window.location.pathname.match(/\/submissions\/(\d+)/);
    return match ? match[1] : null;
  }

  function getSubmissionKey() {
    return getSubmissionId() || getProblemSlug();
  }

  /**
   * Cached decision results, keyed per submission, so a revisit renders the
   * previous analysis without a new API call.
   */
  async function readCachedResult() {
    const key = getSubmissionKey();
    if (!key) return null;
    try {
      const stored = await chrome.storage.local.get(CACHE_PREFIX + key);
      const entry = stored?.[CACHE_PREFIX + key];
      return entry?.data ? entry : null;
    } catch (e) {
      console.warn("[Teabag] Failed to read cached result:", e);
      return null;
    }
  }

  async function writeCachedResult(data, updatedAt = Date.now()) {
    const key = getSubmissionKey();
    if (!key) return;
    try {
      await chrome.storage.local.set({
        [CACHE_PREFIX + key]: { data, cachedAt: updatedAt }
      });
    } catch (e) {
      console.warn("[Teabag] Failed to cache result:", e);
    }
  }

  function setButtonIdle(btn) {
    if (!btn) return;
    btn.classList.remove("teabag-loading");
    btn.title = "Teabag it — Run analysis (Approach, Efficiency, Code Style)";
    btn.innerHTML = `${WAVES_SVG} <span class="teabag-btn-label">Teabag it</span>`;
  }

  function setButtonDone(btn) {
    if (!btn) return;
    btn.classList.remove("teabag-loading");
    btn.title = "Teabagged — re-run analysis";
    btn.innerHTML = `${CHECK_SVG} <span class="teabag-btn-label">Teabagged</span>`;
  }

  async function fetchProblemViaGraphQL(titleSlug) {
    if (!titleSlug) return null;
    try {
      const response = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operationName: "questionData",
          query: `query questionData($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              questionId
              title
              content
              difficulty
              topicTags { name }
            }
          }`,
          variables: { titleSlug }
        })
      });

      if (!response.ok) return null;
      const data = await response.json();
      const q = data?.data?.question;
      if (!q) return null;

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = q.content || "";
      const textContent = tempDiv.innerText || tempDiv.textContent || "";

      return {
        title: q.title,
        description: textContent.trim(),
        difficulty: q.difficulty,
        tags: q.topicTags?.map(t => t.name) || []
      };
    } catch (e) {
      console.warn("[Teabag] GraphQL query failed, using fallback:", e);
      return null;
    }
  }

  function scrapeProblemFromDOM() {
    const descEl = document.querySelector('[data-track-load="description_content"]')
      || document.querySelector('div[class*="description"]')
      || document.querySelector('.elfjS');

    if (descEl) {
      return {
        title: document.title.replace("- LeetCode", "").trim(),
        description: descEl.innerText.trim(),
        difficulty: "",
        tags: []
      };
    }
    return null;
  }

  function getSubmissionContainer() {
    const candidates = document.querySelectorAll('div[class*="max-w-[700px]"]');
    for (const c of candidates) {
      if (c.querySelector('[data-e2e-locator="submission-result"]') || c.innerText.includes("Accepted") || c.innerText.includes("Runtime")) {
        return c;
      }
    }

    const statusEl = document.querySelector('[data-e2e-locator="submission-result"]');
    if (statusEl) {
      const ancestor = statusEl.closest('div[class*="flex-col"]');
      if (ancestor) return ancestor;
    }

    return null;
  }

  function getButtonGroupContainer(submissionContainer) {
    if (!submissionContainer) return null;

    const groups = submissionContainer.querySelectorAll('div.flex.flex-none.gap-2, div[class*="flex-none"][class*="gap-"]');
    for (const g of groups) {
      if (g.querySelector("button")) return g;
    }

    const firstRow = submissionContainer.firstElementChild;
    if (firstRow) {
      const buttons = firstRow.querySelectorAll("button");
      if (buttons.length > 0) {
        return buttons[0].parentElement?.parentElement || buttons[0].parentElement;
      }
    }

    return null;
  }

  function getSubmissionCode(submissionContainer) {
    if (!submissionContainer) return { code: "", language: "" };

    const codeEl = submissionContainer.querySelector("pre code");
    let code = codeEl ? (codeEl.innerText || codeEl.textContent) : "";

    let language = "python";
    if (codeEl && codeEl.className) {
      const match = codeEl.className.match(/language-([a-zA-Z0-9+#_]+)/);
      if (match) language = match[1];
    }

    const langHeader = submissionContainer.querySelector('div:has(> pre), div:has(> .react-syntax-highlighter)');
    if (langHeader && langHeader.previousElementSibling) {
      const headerText = langHeader.previousElementSibling.innerText || "";
      if (headerText.includes("|")) {
        language = headerText.split("|").pop().trim();
      }
    }

    return { code: code.trim(), language };
  }

  function injectButton() {
    const container = getSubmissionContainer();
    if (!container) return;

    const buttonGroup = getButtonGroupContainer(container);
    if (!buttonGroup) return;

    // LeetCode navigates client-side: reset card state when the submission changes
    const submissionKey = getSubmissionKey() || "";
    if (submissionKey !== lastSubmissionKey) {
      lastSubmissionKey = submissionKey;
      currentDecisionData = null;
      document.getElementById("teabag-result-card")?.remove();
    }

    if (document.getElementById("teabag-ai-analysis-btn")) return;

    const btn = document.createElement("button");
    btn.id = "teabag-ai-analysis-btn";
    btn.className = "teabag-ai-btn";
    setButtonIdle(btn);

    btn.addEventListener("click", () => {
      handleAnalyzeClick(container, btn);
    });

    buttonGroup.insertBefore(btn, buttonGroup.firstChild);

    // Revisit: restore the cached analysis for this submission
    restoreCachedAnalysis(container, btn);

    // Responsive compact state observer matching LeetCode button behavior
    if (window.ResizeObserver) {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          if (width < 520) {
            btn.classList.add("compact");
          } else {
            btn.classList.remove("compact");
          }
        }
      });
      ro.observe(container);
    }
  }

  /**
   * Renders the cached analysis for this submission, if one exists
   */
  async function restoreCachedAnalysis(container, btn) {
    if (currentDecisionData || isAnalyzing) return;
    const cached = await readCachedResult();
    if (!cached || currentDecisionData || isAnalyzing) return;
    setButtonDone(btn);
    renderCard(container, { status: "success", data: cached.data, updatedAt: cached.cachedAt });
  }

  function parseAIResponse(rawText) {
    let clean = (rawText || "").trim();
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(clean);
  }

  /**
   * Mounts or retrieves the result card element in the submission container
   */
  function getOrCreateCard(container) {
    let card = document.getElementById("teabag-result-card");
    if (!card) {
      card = document.createElement("div");
      card.id = "teabag-result-card";
      card.className = "teabag-card";

      const firstRow = container.firstElementChild;
      if (firstRow && firstRow.nextElementSibling) {
        container.insertBefore(card, firstRow.nextElementSibling);
      } else {
        container.prepend(card);
      }
    }
    return card;
  }

  /**
   * Renders the interactive step content and attaches listeners
   */
  function renderStep(container, card, data, stepIndex, updatedAt) {
    card.innerHTML = renderStepHtml(data, stepIndex, updatedAt);

    // Metric tab clicks (matching LeetCode's Runtime/Memory tab switching)
    card.querySelectorAll(".teabag-metric-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        activeStep = parseInt(tab.getAttribute("data-step"), 10);
        renderStep(container, card, data, activeStep, updatedAt);
      });
    });

    // Step capsule clicks (fallback)
    card.querySelectorAll(".teabag-capsule").forEach(cap => {
      cap.addEventListener("click", () => {
        activeStep = parseInt(cap.getAttribute("data-step"), 10);
        renderStep(container, card, data, activeStep, updatedAt);
      });
    });

    // Primary action button (Next Field / Finish)
    const primaryBtn = card.querySelector("#teabag-primary-action");
    primaryBtn?.addEventListener("click", () => {
      if (stepIndex < 2) {
        activeStep = stepIndex + 1;
        renderStep(container, card, data, activeStep, updatedAt);
      } else {
        primaryBtn.textContent = "✓ Complete";
        setTimeout(() => {
          activeStep = 0;
          renderStep(container, card, data, 0, updatedAt);
        }, 1200);
      }
    });

    // Re-run analysis (bypasses and overwrites the cached result)
    card.querySelector("#teabag-refresh-action")?.addEventListener("click", () => {
      const btn = document.getElementById("teabag-ai-analysis-btn");
      handleAnalyzeClick(container, btn);
    });

    // Copy analysis to clipboard
    const copyBtn = card.querySelector("#teabag-copy-action");
    copyBtn?.addEventListener("click", () => {
      const markdown = buildMarkdownSummary(data, getProblemMeta());
      navigator.clipboard.writeText(markdown).then(() => {
        const label = copyBtn.querySelector("span");
        if (label) label.textContent = "Copied!";
        setTimeout(() => { if (label) label.textContent = "Copy Analysis"; }, 2000);
      });
    });

    // Close button / dismiss
    card.querySelector("#teabag-menu-btn")?.addEventListener("click", () => {
      card.remove();
    });
  }

  /**
   * Render loading, error, or success state
   */
  function renderCard(container, state) {
    const card = getOrCreateCard(container);

    if (state.status === "loading") {
      card.innerHTML = renderLoadingHtml(state.message);
      return;
    }

    if (state.status === "error") {
      card.innerHTML = renderErrorHtml(state.error);
      card.querySelector("#teabag-card-retry")?.addEventListener("click", () => {
        const btn = document.getElementById("teabag-ai-analysis-btn");
        handleAnalyzeClick(container, btn);
      });
      return;
    }

    if (state.status === "success" && state.data) {
      currentDecisionData = state.data;
      activeStep = 0;
      renderStep(container, card, currentDecisionData, activeStep, state.updatedAt);
    }
  }

  async function handleAnalyzeClick(container, btn) {
    if (isAnalyzing) return;
    isAnalyzing = true;

    if (btn) {
      btn.classList.add("teabag-loading");
      btn.innerHTML = `${SPINNER_SVG} <span class="teabag-btn-label">Analyzing...</span>`;
    }

    renderCard(container, { status: "loading", message: "Fetching problem statement & submission code..." });

    try {
      const slug = getProblemSlug();
      const { code, language } = getSubmissionCode(container);

      if (!code) {
        throw new Error("Could not find submitted code on this page. Please ensure the Code tab is visible.");
      }

      let problem = await fetchProblemViaGraphQL(slug);
      if (!problem || !problem.description) {
        problem = scrapeProblemFromDOM() || { title: slug, description: "" };
      }

      renderCard(container, { status: "loading", message: "Running decision modeling..." });

      activePort = chrome.runtime.connect({ name: "teabag-analysis-stream" });

      activePort.postMessage({
        action: "analyze",
        payload: {
          problemTitle: problem.title,
          problemSlug: slug,
          problemDescription: problem.description,
          code: code,
          language: language
        }
      });

      let accumulated = "";

      activePort.onMessage.addListener((msg) => {
        if (msg.type === "status") {
          renderCard(container, { status: "loading", message: msg.status });
        } else if (msg.type === "chunk") {
          accumulated += msg.content;
          renderCard(container, { status: "loading", message: "Receiving decision results..." });
        } else if (msg.type === "done") {
          isAnalyzing = false;

          try {
            const parsedData = msg.decisionData || parseAIResponse(msg.fullText || accumulated);
            const updatedAt = Date.now();
            setButtonDone(btn);
            renderCard(container, { status: "success", data: parsedData, updatedAt });
            writeCachedResult(parsedData, updatedAt);
          } catch (jsonErr) {
            console.error("[Teabag] JSON parse error:", jsonErr, msg.fullText);
            setButtonIdle(btn);
            renderCard(container, {
              status: "error",
              error: "Received non-standard response from model. Please try again."
            });
          }
        } else if (msg.type === "error") {
          isAnalyzing = false;
          setButtonIdle(btn);
          renderCard(container, { status: "error", error: msg.error });
        }
      });

      activePort.onDisconnect.addListener(() => {
        if (isAnalyzing) {
          isAnalyzing = false;
          setButtonIdle(btn);
        }
      });

    } catch (err) {
      isAnalyzing = false;
      setButtonIdle(btn);
      renderCard(container, { status: "error", error: err.message });
    }
  }

  function startObserver() {
    let timeout = null;
    const observer = new MutationObserver(() => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        injectButton();
      }, 300);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    injectButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver);
  } else {
    startObserver();
  }
})();
