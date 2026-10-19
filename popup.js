document.addEventListener("DOMContentLoaded", async () => {
  const apiKeyInput = document.getElementById("apiKey");
  const saveBtn = document.getElementById("saveBtn");
  const statusDiv = document.getElementById("status");

  // Load existing config
  chrome.runtime.sendMessage({ action: "get_config" }, (res) => {
    if (res && res.apiKey && res.apiKey !== "YOUR_OPENROUTER_API_KEY") {
      apiKeyInput.value = res.apiKey;
    }
  });

  saveBtn.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();

    chrome.runtime.sendMessage({
      action: "save_config",
      apiKey
    }, (response) => {
      if (response && response.success) {
        statusDiv.textContent = "Settings saved successfully!";
        statusDiv.className = "status success";
        setTimeout(() => {
          statusDiv.textContent = "";
        }, 3000);
      } else {
        statusDiv.textContent = "Error saving settings.";
        statusDiv.className = "status error";
      }
    });
  });
});

