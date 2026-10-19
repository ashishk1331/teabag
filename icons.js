/**
 * Teabag - SVG Icons
 * Clean icons matching the native LeetCode theme.
 */

window.TeabagIcons = (() => {
  // Signal Bars SVG Icon (LeetCode Theme)
  const SIGNAL_ICON_SVG = `
    <div class="teabag-signal-icon">
      <div class="teabag-signal-bar" style="height: 6px;"></div>
      <div class="teabag-signal-bar" style="height: 9px;"></div>
      <div class="teabag-signal-bar" style="height: 12px;"></div>
      <div class="teabag-signal-bar" style="height: 14px;"></div>
    </div>`;

  // Lucide Waves Vertical Icon
  const WAVES_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="teabag-icon teabag-waves-icon lucide lucide-waves-vertical preview-icon">
      <path d="M12 2q2 2.5 0 5t0 5 0 5 0 5"/>
      <path d="M19 2q2 2.5 0 5t0 5 0 5 0 5"/>
      <path d="M5 2q2 2.5 0 5t0 5 0 5 0 5"/>
    </svg>`;

  // Lucide Square Function Icon (for Approach)
  const APPROACH_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="teabag-icon lucide lucide-square-function preview-icon">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
      <path d="M9 17c2 0 2.8-1 2.8-2.8V10c0-2 1-3.3 3.2-3"/>
      <path d="M9 11.2h5.7"/>
    </svg>`;

  // Lucide Check Icon (button success state)
  const CHECK_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="teabag-icon lucide lucide-check preview-icon">
      <path d="M20 6 9 17l-5-5"/>
    </svg>`;

  // Lucide Loader Spinner Icon
  const SPINNER_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="teabag-icon teabag-spinner lucide lucide-loader preview-icon">
      <path d="M12 2v4"/>
      <path d="m16.2 7.8 2.9-2.9"/>
      <path d="M18 12h4"/>
      <path d="m16.2 16.2 2.9 2.9"/>
      <path d="M12 18v4"/>
      <path d="m4.9 19.1 2.9-2.9"/>
      <path d="M2 12h4"/>
      <path d="m4.9 4.9 2.9 2.9"/>
    </svg>`;

  // Clock Icon (for Efficiency)
  const CLOCK_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="teabag-icon">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>`;

  // Code Icon (for Code Style)
  const CODE_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="teabag-icon">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>`;

  // Copy Icon
  const COPY_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="teabag-icon">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>`;

  // Refresh Icon (re-run analysis)
  const REFRESH_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="teabag-icon lucide lucide-refresh-cw preview-icon">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M8 16H3v5"/>
    </svg>`;

  // Close Icon
  const CLOSE_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="teabag-icon">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>`;

  return {
    SIGNAL_ICON_SVG,
    WAVES_SVG,
    ACTIVITY_SVG: WAVES_SVG,
    APPROACH_SVG,
    CHECK_SVG,
    SPINNER_SVG,
    CLOCK_SVG,
    CODE_SVG,
    COPY_SVG,
    REFRESH_SVG,
    CLOSE_SVG
  };
})();

