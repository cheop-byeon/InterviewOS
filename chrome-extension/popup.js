let currentMode = "job_clip";
let activeTabUrl = "";
let activeTabTitle = "";

const tabJob = document.getElementById("tabJob");
const tabQuestion = document.getElementById("tabQuestion");
const companyInput = document.getElementById("companyInput");
const contentLabel = document.getElementById("contentLabel");
const contentInput = document.getElementById("contentInput");
const submitBtn = document.getElementById("submitBtn");
const resultBox = document.getElementById("resultBox");

tabJob.addEventListener("click", () => {
  currentMode = "job_clip";
  tabJob.classList.add("active");
  tabQuestion.classList.remove("active");
  contentLabel.textContent = "Highlighted Job Description / Page Text";
  submitBtn.textContent = "Clip Job to Kanban CRM & Run ATS Scan";
});

tabQuestion.addEventListener("click", () => {
  currentMode = "question_clip";
  tabQuestion.classList.add("active");
  tabJob.classList.remove("active");
  contentLabel.textContent = "Highlighted Onsite Interview Experience / Question";
  submitBtn.textContent = "Capture Question to SQLite Question Bank";
});

// Auto-extract highlighted selection or page text from active browser tab
if (typeof chrome !== "undefined" && chrome.tabs && chrome.scripting) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.id) return;
    activeTabUrl = tab.url || "";
    activeTabTitle = tab.title || "";

    // Guess company from page title or URL
    const known = ["OpenAI", "Anthropic", "Stripe", "Uber", "Meta", "Google", "Amazon", "Databricks", "Netflix", "Airbnb"];
    const foundCompany = known.find((c) => activeTabTitle.toLowerCase().includes(c.toLowerCase()) || activeTabUrl.toLowerCase().includes(c.toLowerCase()));
    if (foundCompany) {
      companyInput.value = foundCompany;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        func: () => {
          const sel = window.getSelection()?.toString()?.trim();
          if (sel && sel.length > 20) return sel;
          return document.body?.innerText?.slice(0, 3500) || "";
        }
      },
      (results) => {
        if (results && results[0] && results[0].result) {
          contentInput.value = results[0].result;
        }
      }
    );
  });
}

submitBtn.addEventListener("click", async () => {
  const text = contentInput.value.trim();
  const company = companyInput.value.trim() || "OpenAI";
  if (!text) {
    resultBox.style.display = "block";
    resultBox.innerHTML = "<span style='color:#f87171'>Please highlight or paste text first.</span>";
    return;
  }

  submitBtn.textContent = "Syncing to SQLite (localhost:3000)...";
  try {
    const res = await fetch("http://localhost:3000/api/extension/clip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: currentMode,
        company,
        title: activeTabTitle,
        url: activeTabUrl,
        jdText: text,
        rawText: text
      })
    });
    const data = await res.json();
    resultBox.style.display = "block";

    if (data.ok && currentMode === "job_clip") {
      const missing = (data.missingKeywords || []).join(", ") || "None!";
      resultBox.innerHTML = `
        <div><strong>✓ Added to Kanban CRM (${data.jobCard.company} • ${data.jobCard.level})</strong></div>
        <div style="margin-top:4px;">Live ATS Match: <span class="score-pill">${data.atsScore}%</span></div>
        <div class="tags"><strong>Missing Keywords:</strong> ${missing}</div>
      `;
    } else if (data.ok && currentMode === "question_clip") {
      resultBox.innerHTML = `
        <div><strong>✓ Saved to SQLite Question Bank!</strong></div>
        <div style="margin-top:4px;color:#94a3b8;">${data.question.questionTitle}</div>
      `;
    } else {
      resultBox.innerHTML = `<span style="color:#f87171">Error: ${data.error || "Failed"}</span>`;
    }
  } catch (err) {
    resultBox.style.display = "block";
    resultBox.innerHTML = "<span style='color:#f87171'>Could not reach http://localhost:3000. Ensure InterviewOS dev server is running.</span>";
  } finally {
    submitBtn.textContent =
      currentMode === "job_clip"
        ? "Clip Job to Kanban CRM & Run ATS Scan"
        : "Capture Question to SQLite Question Bank";
  }
});
