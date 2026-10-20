![Teabag banner](banner.png)

# Teabag

A Chromium extension that adds a **Teabag it** button to LeetCode submission pages and analyzes your solution with `inception/mercury-decide:free` through the OpenRouter Decisions API. Each analysis asks typed questions: `choice` for paradigms and complexities, `score` for code quality, and `noul` for yes/no properties.

## Features

- **Approach**: classifies the solution into one of 30+ DSA paradigms and compares it with the optimal approach.
- **Efficiency**: checks time and space complexity against the best achievable bounds.
- **Code style**: ranks quality (`EXCELLENT`, `GOOD`, `FAIR`, `POOR`) and lists strengths and improvements.
- **Copy**: exports the analysis as Markdown.
- **Refresh**: re-runs the analysis and overwrites the cached result.
- **Last updated**: shows when the displayed analysis was generated, including restored results.
- **Cache**: restores the previous analysis per submission and keeps the button in its **Teabagged** state.
- **Theme**: follows LeetCode's dark and light modes.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ashishk1331/teabag.git
   ```
2. Open a Chromium-based browser and go to `chrome://extensions/` (`edge://extensions/` on Edge).
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the `teabag` folder.
5. Pin Teabag from the extensions toolbar.

## Configuration

Click the Teabag icon, paste your [OpenRouter API key](https://openrouter.ai/keys) (`sk-or-v1-...`), and click **Save Settings**. The model is fixed to `inception/mercury-decide:free`.

To hardcode the key for personal use, edit `background.js`:

```javascript
const HARDCODED_OPENROUTER_API_KEY = "sk-or-v1-your-key-here";
```

## Usage

1. Open a problem on [LeetCode](https://leetcode.com).
2. Go to the **Submissions** tab and open a submission.
3. Click **Teabag it** next to the **Solution** button.
4. The analysis card opens above the submission.
5. When it finishes, the button becomes **Teabagged** with a check icon. The result is cached; use **Refresh** to run the analysis again.

## Project structure

```
teabag/
├── manifest.json       # Manifest V3 configuration
├── background.js       # Service worker and OpenRouter Decisions API proxy
├── icons.js            # SVG icon definitions
├── templates.js        # Card, loading, error, and Markdown templates
├── content.js          # DOM extraction, GraphQL query, card lifecycle
├── content.css         # Card styles for LeetCode's dark and light themes
├── popup.html          # Settings popup
├── popup.js            # Settings save and load
├── icons/              # Extension icons (16, 48, and 128 px)
└── README.md
```
