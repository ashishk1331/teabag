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
   * Formats a timestamp for the footer's "Last updated" label
   */
  function formatTimestamp(ts) {
    if (!ts) return null;
    const date = new Date(ts);
    if (Number.isNaN(date.getTime())) return null;
    return {
      text: new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }).format(date),
      iso: date.toISOString()
    };
  }

  /**
   * Builds a single metric tab for the card's top row
   */
  function renderMetricTab({ step, icon, label, value, active }) {
    return `
      <div class="teabag-metric-tab group flex flex-1 cursor-pointer flex-col rounded-sd px-4 py-3 text-xs transition hover:opacity-100 ${active ? "active bg-sd-accent opacity-100" : "opacity-45"}" data-step="${step}">
        <div class="flex justify-between gap-2">
          <div class="flex items-center gap-1.5 text-sd-foreground">
            ${icon}
            <div class="flex-1 text-sm font-medium">${label}</div>
          </div>
        </div>
        <div class="mt-2 flex items-center gap-1.5 flex-wrap">
          <span class="text-base font-semibold text-sd-foreground">${escapeHtml(value)}</span>
        </div>
      </div>
    `;
  }

  /**
   * Builds the inner HTML of the decision card matching LeetCode's card layout
   */
  function renderStepHtml(data, stepIndex, updatedAt) {
    const { approach, efficiency, code_style } = data || {};

    const rank = (code_style?.rank || "GOOD").toUpperCase();
    const updated = formatTimestamp(updatedAt);

    const tabs = [
      { step: 0, icon: APPROACH_SVG, label: "Approach", value: approach?.current || "N/A" },
      { step: 1, icon: CLOCK_SVG, label: "Efficiency", value: efficiency?.current_time || "N/A" },
      { step: 2, icon: CODE_SVG, label: "Code Style", value: rank }
    ];

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
        ${tabs.map(tab => renderMetricTab({ ...tab, active: stepIndex === tab.step })).join("")}
      </div>

      <!-- Detail Box for Selected Metric -->
      <div class="teabag-detail-box">
        ${detailContent}
      </div>

      <!-- Action Footer -->
      <div class="teabag-card-footer">
        ${updated ? `<span class="teabag-updated">Last updated <time datetime="${updated.iso}">${escapeHtml(updated.text)}</time></span>` : ""}
        <div class="teabag-footer-actions">
          <button id="teabag-refresh-action" class="teabag-action-btn" title="Re-run analysis">
            ${REFRESH_SVG}
            <span>Refresh</span>
          </button>
          <button id="teabag-copy-action" class="teabag-action-btn" title="Copy Markdown Summary">
            ${COPY_SVG}
            <span>Copy Analysis</span>
          </button>
        </div>
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
  function buildMarkdownSummary(data, problem) {
    const { approach, efficiency, code_style, model } = data || {};
    const meta = [];
    if (problem?.title) meta.push(`**Problem:** ${problem.title}`);
    if (problem?.url) meta.push(`**URL:** ${problem.url}`);
    meta.push(`**Model:** ${model || "inception/mercury-decide:free"}`);

    return `### Teabag Analysis
${meta.join("\n")}

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

_Analysis done using Teabag by ashishk1331_
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
