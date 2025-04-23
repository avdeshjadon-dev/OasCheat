async function getGeminiAnswer(question) {
  const apiKey = "API KEY HERE"; // Replace with your actual API key
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text:
              question +
              "\n\nOnly return the correct option (like A, B, C or D). Do NOT explain.",
          },
        ],
      },
    ],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase() ||
      ""
    );
  } catch {
    return "";
  }
}

function extractQuestionAndOptions() {
  const questionEl =
    document.querySelector("div[style*='font-weight:bold']") ||
    document.querySelector("div.question") ||
    document.querySelector("h2, h3, p");
  const question = questionEl?.textContent.trim() || "";

  const options = [];
  const optionMap = {};

  document.querySelectorAll("input[type='radio']").forEach((input, index) => {
    const labelText =
      input.closest("tr")?.textContent.trim() ||
      input.parentElement?.textContent.trim();
    if (labelText) {
      const optionLetter = String.fromCharCode(65 + index);
      options.push(`${optionLetter}. ${labelText}`);
      optionMap[optionLetter] = input.closest("tr") || input.parentElement;
    }
  });

  return { question, options: options.join("\n"), optionMap };
}

async function highlightAnswer() {
  const { question, options, optionMap } = extractQuestionAndOptions();
  if (!question || Object.keys(optionMap).length === 0) return;

  const answer = await getGeminiAnswer(`${question}\n${options}`);
  const elToHighlight = optionMap[answer];
  if (elToHighlight) {
    elToHighlight.style.backgroundColor = "#c8f7c5";
    elToHighlight.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function injectAnswerButton() {
  if (document.getElementById("gemini-answer-button")) return;

  const btn = document.createElement("button");
  btn.id = "gemini-answer-button";
  btn.title = "Show Answer";
  btn.innerHTML = "✓";
  btn.style.cssText = `
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background:rgb(248, 248, 248); /* darker, strong green */
    color: white;
    border: none;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    z-index: 10000;
    position: relative;
    margin-left: 8px;
  `;
  btn.onclick = highlightAnswer;

  // Drag logic
  let isDragging = false;
  let offsetX, offsetY;

  btn.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - btn.getBoundingClientRect().left;
    offsetY = e.clientY - btn.getBoundingClientRect().top;
    btn.style.cursor = "grabbing";
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      btn.style.position = "absolute";
      btn.style.left = `${e.clientX - offsetX}px`;
      btn.style.top = `${e.clientY - offsetY}px`;
      btn.style.right = "auto";
      btn.style.bottom = "auto";
    }
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      btn.style.cursor = "grab";
    }
  });

  // Try placing it next to the registration number
  const regNoEl = Array.from(document.querySelectorAll("div, span, td")).find(
    (el) => el.textContent.match(/(\d{9,})/) // assuming reg no is a 9+ digit number
  );

  if (regNoEl && regNoEl.parentElement) {
    regNoEl.parentElement.appendChild(btn);
  } else {
    document.body.appendChild(btn);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", injectAnswerButton);
} else {
  injectAnswerButton();
}

setInterval(injectAnswerButton, 3000);
