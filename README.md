# 🫖 Teabag — LeetCode AI Submission Analyzer

A lightweight Chromium browser extension (Chrome, Edge, Brave, etc.) that adds a **"Teabag it"** button to LeetCode submission pages. Powered by Inception's structured decision model **`inception/mercury-decide:free`** via the OpenRouter Decisions API.

---

## ✨ Features

- **🎯 Approach Classification**:
  Classifies your solution into one of 30+ standard DSA paradigms (e.g., *Dynamic Programming, Hash Table, Math, Sliding Window, Monotonic Stack, etc.*) and suggests the optimal approach for the pattern.
- **⚡ Efficiency Complexity**:
  Evaluates Big-O time and space complexity (e.g., *O(1), O(log n), O(n), O(n log n), O(n^2), etc.*) against the best achievable theoretical bound for the problem.
- **🎨 Code Style & Readability**:
  Assigns a quality rank (`EXCELLENT`, `GOOD`, `FAIR`, `POOR`), highlights clean code strengths, and provides actionable code quality tips.
- **🧠 OpenRouter Decisions API**:
  Uses OpenRouter's native alpha decisions endpoint (`POST https://openrouter.ai/api/alpha/decisions`) with `choice` questions for paradigms and complexities, a `score` question for code quality, and `noul` (yes/no probability) questions for optimality checks.
- **📋 One-Click Copy**:
  Exports the structured evaluation directly to Markdown.
- **♻️ Refresh**:
  A refresh button on the result card re-runs the analysis on demand and overwrites the cached result.
- **💾 Per-Submission Cache**:
  Results are cached in local storage per submission, so revisiting a submission shows the previous analysis instantly (with the button showing **"Teabagged"** and a check icon) without another API call.
- **🌓 LeetCode Native Theme**:
  Seamlessly matches LeetCode's design language, typography, and dark/light modes.

---

## 🚀 Installation

1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-username/teabag.git
   ```
2. Open any Chromium-based browser (Chrome, Brave, Edge, Opera).
3. Navigate to `chrome://extensions/` (or `edge://extensions/`).
4. Enable **Developer mode** (toggle in the top-right corner).
5. Click **"Load unpacked"** and select the `teabag/` folder.
6. The Teabag icon will appear in your extensions toolbar.

---

## 🔑 Configuration

### Option A: Via Extension Popup (Recommended)
1. Click the Teabag icon in your browser toolbar.
2. Enter your [OpenRouter API Key](https://openrouter.ai/keys) (`sk-or-v1-...`).
3. Click **"Save Settings"**. The model is fixed to `inception/mercury-decide:free`; no model configuration is needed.

> **Note:** `inception/mercury-decide:free` is a structured decision model: `choice` questions return real labels (paradigm, complexities), `score` rates code quality, and `noul` answers yes/no properties. The extension builds the `state` (problem statement + submitted code) automatically.

### Option B: Hardcoded (Personal Use)
Edit `background.js` and set your key directly:
```javascript
const HARDCODED_OPENROUTER_API_KEY = "sk-or-v1-your-key-here";
```

---

## 💻 Usage

1. Open any problem on [LeetCode](https://leetcode.com).
2. Go to your **Submissions** tab (or view any accepted/failed submission details).
3. You will see the **"Teabag it"** button right next to the "Solution" button.
4. Click **"Teabag it"** to run the analysis card right at the top of the submission view!
5. Once the analysis is done, the button switches to **"Teabagged"** with a check icon. Revisiting that submission later will show the cached result instantly; use the **Refresh** button on the card to re-run the analysis.

---

## 📁 Project Structure

```
teabag/
├── manifest.json       # Manifest V3 configuration
├── background.js       # Background service worker (OpenRouter Decisions API proxy)
├── icons.js            # SVG icon definitions (Activity, Loader, Signal)
├── templates.js        # View templates (Decision step card, loading, error, markdown)
├── content.js          # Content script (DOM extraction, GraphQL query, card lifecycle)
├── content.css         # UI styles (native LeetCode dark theme)
├── popup.html          # Extension configuration UI
├── popup.js            # Configuration save/load logic
├── icons/              # Extension icons (16x16, 48x48, 128x128)
└── README.md
```

