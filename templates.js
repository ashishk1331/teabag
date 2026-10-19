/**
 * Teabag - HTML UI Templates
 * Minimal, clean single-surface card layout without nested containers.
 */

window.TeabagTemplates = (() => {
  const {
    APPROACH_SVG,
    CLOCK_SVG,
    CODE_SVG,
    COPY_SVG,
    REFRESH_SVG,
    CLOSE_SVG,
    SPINNER_SVG
  } = window.TeabagIcons || {};

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Builds the inner HTML of the decision card matching LeetCode's card layout
   */
  function renderStepHtml(data, stepIndex) {
    const { approach, efficiency, code_style } = data || {};

    const rank = (code_style?.rank || "GOOD").toUpperCase();

    // 1. Approach Tab Box (Formatted like LeetCode Runtime/Memory box)
    const approachTab = `
      <div class="teabag-metric-tab group flex flex-1 cursor-pointer flex-col rounded-sd px-4 py-3 text-xs transition hover:opacity-100 ${stepIndex === 0 ? "active bg-sd-accent opacity-100" : "opacity-45"}" data-step="0">
        <div class="flex justify-between gap-2">
          <div class="flex items-center gap-1.5 text-sd-foreground">
            ${APPROACH_SVG}
            <div class="flex-1 text-sm font-medium">Approach</div>
          </div>
        </div>
        <div class="mt-2 flex items-center gap-1.5 flex-wrap">
          <span class="text-base font-semibold text-sd-foreground">${escapeHtml(approach?.current || "N/A")}</span>
        </div>
      </div>
    `;

    // 2. Efficiency Tab Box
    const efficiencyTab = `
      <div class="teabag-metric-tab group flex flex-1 cursor-pointer flex-col rounded-sd px-4 py-3 text-xs transition hover:opacity-100 ${stepIndex === 1 ? "active bg-sd-accent opacity-100" : "opacity-45"}" data-step="1">
        <div class="flex justify-between gap-2">
          <div class="flex items-center gap-1.5 text-sd-foreground">
            ${CLOCK_SVG}
            <div class="flex-1 text-sm font-medium">Efficiency</div>
          </div>
        </div>
        <div class="mt-2 flex items-center gap-1.5 flex-wrap">
          <span class="text-base font-semibold text-sd-foreground">${escapeHtml(efficiency?.current_time || "N/A")}</span>
        </div>
      </div>
    `;

    // 3. Code Style Tab Box
    const styleTab = `
      <div class="teabag-metric-tab group flex flex-1 cursor-pointer flex-col rounded-sd px-4 py-3 text-xs transition hover:opacity-100 ${stepIndex === 2 ? "active bg-sd-accent opacity-100" : "opacity-45"}" data-step="2">
        <div class="flex justify-between gap-2">
          <div class="flex items-center gap-1.5 text-sd-foreground">
            ${CODE_SVG}
            <div class="flex-1 text-sm font-medium">Code Style</div>
          </div>
        </div>
        <div class="mt-2 flex items-center gap-1.5 flex-wrap">
          <span class="text-base font-semibold text-sd-foreground">${escapeHtml(rank)}</span>
        </div>
      </div>
    `;

    // Detail Box for Selected Metric
    let detailContent = "";
    if (stepIndex === 0) {
      detailContent = `
        <div class="teabag-detail-row">
          <span>Current: <strong>${escapeHtml(approach?.current || "N/A")}</strong></span>
          <span class="teabag-sep">•</span>
          <span>Suggested Optimal: <strong>${escapeHtml(approach?.suggested || approach?.current || "N/A")}</strong></span>
          ${approach?.confidence ? `<span class="teabag-sep">•</span><span>Confidence: <strong>${approach.confidence}%</strong></span>` : ""}
        </div>
        <div class="teabag-detail-body">
          ${escapeHtml(approach?.rationale || "")}
        </div>
      `;
    } else if (stepIndex === 1) {
      detailContent = `
        <div class="teabag-detail-row">
          <span>Theoretical Time Bound: <strong>${escapeHtml(efficiency?.optimal_time || efficiency?.current_time || "O(1)")}</strong></span>
          <span class="teabag-sep">•</span>
          <span>Auxiliary Space: <strong>${escapeHtml(efficiency?.current_space || "O(1)")}</strong></span>
          ${efficiency?.confidence ? `<span class="teabag-sep">•</span><span>Confidence: <strong>${efficiency.confidence}%</strong></span>` : ""}
        </div>
        <div class="teabag-detail-body">
          ${escapeHtml(efficiency?.explanation || "")}
        </div>
      `;
    } else {
      const strengths = code_style?.strengths || [];
      const improvements = code_style?.improvements || [];
      const listItems = [
        ...strengths.map(s => `<li class="strength">✓ ${escapeHtml(s)}</li>`),
        ...improvements.map(i => `<li class="improvement">△ ${escapeHtml(i)}</li>`)
      ];

      detailContent = `
        <div class="teabag-detail-row">
          <span>${escapeHtml(code_style?.summary || "")}</span>
        </div>
        ${listItems.length > 0 ? `<ul class="teabag-detail-list">${listItems.join("")}</ul>` : ""}
      `;
    }

    return `
      <!-- Metric Cards Row (All 3 metrics together side-by-side like LeetCode Runtime/Memory) -->
      <div class="teabag-metric-grid">
        ${approachTab}
        ${efficiencyTab}
        ${styleTab}
      </div>

      <!-- Detail Box for Selected Metric -->
      <div class="teabag-detail-box">
        ${detailContent}
      </div>

      <!-- Action Footer -->
      <div class="teabag-card-footer">
        <button id="teabag-refresh-action" class="teabag-action-btn" title="Re-run analysis">
          ${REFRESH_SVG}
          <span>Refresh</span>
        </button>
        <button id="teabag-copy-action" class="teabag-action-btn" title="Copy Markdown Summary">
          ${COPY_SVG}
          <span>Copy Analysis</span>
        </button>
      </div>
    `;
  }

  /**
   * Builds loading state HTML matching LeetCode card
   */
  function renderLoadingHtml(message) {
    return `
      <div class="teabag-loading-box">
        <div class="flex items-center gap-2.5 text-sm text-text-primary dark:text-text-primary">
          ${SPINNER_SVG}
          <span>${escapeHtml(message || "Analyzing submission via OpenRouter Decisions API...")}</span>
        </div>
        <div class="teabag-progress-track">
          <div class="teabag-progress-pulse"></div>
        </div>
      </div>
    `;
  }

  /**
   * Builds error state HTML matching LeetCode card
   */
  function renderErrorHtml(error) {
    return `
      <div class="teabag-error-box">
        <div class="text-sm" style="color: #ef4743; line-height: 1.45;">
          ⚠️ ${escapeHtml(error || "Failed to analyze submission.")}
        </div>
        <button class="teabag-retry-btn" id="teabag-card-retry">Retry</button>
      </div>
    `;
  }

  /**
   * Builds markdown report for clipboard copying
   */
  function buildMarkdownSummary(data) {
    const { approach, efficiency, code_style, model } = data || {};
    return `### 🫖 LeetCode AI Submission Analysis
**Model:** ${model || "inception/mercury-decide:free"}

#### 1. Approach
- **Current Approach:** ${approach?.current || "N/A"}
- **Suggested Approach:** ${approach?.suggested || "N/A"}
- **Status:** ${approach?.is_optimal ? "Optimal ✓" : "Suboptimal"}
- **Rationale:** ${approach?.rationale || ""}

#### 2. Efficiency
- **Time Complexity:** ${efficiency?.current_time || "N/A"} (Optimal: ${efficiency?.optimal_time || "N/A"})
- **Space Complexity:** ${efficiency?.current_space || "O(1)"}
- **Explanation:** ${efficiency?.explanation || ""}

#### 3. Code Style (${code_style?.rank || "GOOD"})
- **Summary:** ${code_style?.summary || ""}
${code_style?.strengths ? code_style.strengths.map(s => `- Strengths: ${s}`).join("\n") : ""}
${code_style?.improvements ? code_style.improvements.map(i => `- Improvement: ${i}`).join("\n") : ""}
`;
  }

  return {
    escapeHtml,
    renderStepHtml,
    renderLoadingHtml,
    renderErrorHtml,
    buildMarkdownSummary
  };
})();
