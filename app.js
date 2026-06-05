const moduleGrid = document.querySelector("#moduleGrid");
const moduleView = document.querySelector("#moduleView");
const quizView = document.querySelector("#quizView");
const allPracticeBtn = document.querySelector("#allPracticeBtn");
const backHomeBtn = document.querySelector("#backHomeBtn");
const quizTitle = document.querySelector("#quizTitle");
const progressText = document.querySelector("#progressText");
const progressBar = document.querySelector("#progressBar");
const questionType = document.querySelector("#questionType");
const answeredState = document.querySelector("#answeredState");
const questionStem = document.querySelector("#questionStem");
const optionsList = document.querySelector("#optionsList");
const analysisPanel = document.querySelector("#analysisPanel");
const resultPanel = document.querySelector("#resultPanel");
const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");
const submitBtn = document.querySelector("#submitBtn");
const sourceNote = document.querySelector("#sourceNote");
const moduleCount = document.querySelector("#moduleCount");
const questionCount = document.querySelector("#questionCount");

let activeModule = null;
let activeQuestions = [];
let currentIndex = 0;
let selected = {};
let submitted = {};

function normalizeAnswer(answer) {
  return [...answer].sort().join("");
}

function isCorrect(question, picks) {
  return normalizeAnswer(question.answer) === normalizeAnswer(picks || []);
}

function renderHome() {
  moduleCount.textContent = QUESTION_BANK.modules.length;
  questionCount.textContent = QUESTION_BANK.modules.reduce((sum, item) => sum + item.questions.length, 0);
  sourceNote.textContent = QUESTION_BANK.sourceNote;

  moduleGrid.innerHTML = "";
  QUESTION_BANK.modules.forEach((module) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "module-card";
    card.innerHTML = `
      <h3>${module.title}</h3>
      <p>${module.description}</p>
      <span class="count">${module.questions.length} 道题</span>
    `;
    card.addEventListener("click", () => startQuiz(module.id));
    moduleGrid.appendChild(card);
  });
}

function startQuiz(moduleId) {
  const allModules = QUESTION_BANK.modules;
  if (moduleId === "all") {
    activeModule = {
      id: "all",
      title: "全部实验综合练习",
      questions: allModules.flatMap((module) =>
        module.questions.map((question) => ({ ...question, moduleTitle: module.title }))
      ),
    };
  } else {
    activeModule = allModules.find((item) => item.id === moduleId);
  }
  activeQuestions = activeModule.questions;
  currentIndex = 0;
  selected = {};
  submitted = {};
  moduleView.classList.add("hidden");
  quizView.classList.remove("hidden");
  resultPanel.classList.add("hidden");
  renderQuestion();
}

function renderQuestion() {
  const question = activeQuestions[currentIndex];
  const number = currentIndex + 1;
  const total = activeQuestions.length;
  const picks = selected[question.id] || [];
  const hasSubmitted = Boolean(submitted[question.id]);

  quizTitle.textContent = activeModule.title;
  progressText.textContent = `第 ${number} / ${total} 题`;
  progressBar.style.width = `${(number / total) * 100}%`;
  questionType.textContent = question.type === "multiple" ? "多选题" : "单选题";
  answeredState.textContent = hasSubmitted ? "已提交" : "未提交";
  questionStem.textContent = question.moduleTitle ? `【${question.moduleTitle}】${question.stem}` : question.stem;

  optionsList.innerHTML = "";
  Object.entries(question.options).forEach(([key, text]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `option-btn ${picks.includes(key) ? "selected" : ""}`;
    btn.disabled = hasSubmitted;
    btn.innerHTML = `<span class="option-key">${key}</span><span>${text}</span>`;
    btn.addEventListener("click", () => toggleOption(question, key));
    optionsList.appendChild(btn);
  });

  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === total - 1;
  submitBtn.disabled = hasSubmitted || picks.length === 0;
  submitBtn.textContent = hasSubmitted ? "已提交" : "提交答案";

  if (hasSubmitted) {
    renderAnalysis(question);
  } else {
    analysisPanel.classList.add("hidden");
    analysisPanel.innerHTML = "";
  }

  renderResultIfDone();
}

function toggleOption(question, key) {
  const current = selected[question.id] || [];
  if (question.type === "single") {
    selected[question.id] = [key];
  } else if (current.includes(key)) {
    selected[question.id] = current.filter((item) => item !== key);
  } else {
    selected[question.id] = [...current, key].sort();
  }
  renderQuestion();
}

function submitAnswer() {
  const question = activeQuestions[currentIndex];
  if (!selected[question.id]?.length) return;
  submitted[question.id] = true;
  renderQuestion();
}

function renderAnalysis(question) {
  const picks = selected[question.id] || [];
  const ok = isCorrect(question, picks);
  const answerText = question.answer.join("、");
  const pickText = picks.length ? picks.join("、") : "未选择";

  const rows = Object.entries(question.options).map(([key, text]) => {
    const classes = [
      "explain-item",
      question.answer.includes(key) ? "correct" : "",
      picks.includes(key) && !question.answer.includes(key) ? "wrong-choice" : "",
    ].join(" ");
    return `
      <div class="${classes}">
        <strong>${key}. ${text}</strong><br>
        ${question.explains[key]}
      </div>
    `;
  }).join("");

  analysisPanel.innerHTML = `
    <div class="analysis-summary">
      <div class="summary-box"><span>正确答案</span><strong>${answerText}</strong></div>
      <div class="summary-box"><span>你的选择</span><strong>${pickText}</strong></div>
      <div class="summary-box"><span>判断</span><strong class="${ok ? "ok" : "bad"}">${ok ? "正确" : "错误"}</strong></div>
    </div>
    <div class="explain-list">${rows}</div>
    <div class="knowledge"><strong>知识点：</strong>${question.knowledge}</div>
  `;
  analysisPanel.classList.remove("hidden");
}

function renderResultIfDone() {
  const doneCount = activeQuestions.filter((question) => submitted[question.id]).length;
  if (doneCount !== activeQuestions.length) {
    resultPanel.classList.add("hidden");
    return;
  }

  const wrong = activeQuestions.filter((question) => !isCorrect(question, selected[question.id]));
  const score = activeQuestions.length - wrong.length;
  const wrongHtml = wrong.length
    ? wrong.map((question, index) => `
      <div class="mistake-item">
        <b>${index + 1}. ${question.moduleTitle ? `【${question.moduleTitle}】` : ""}${question.stem}</b><br>
        你的答案：${(selected[question.id] || []).join("、") || "未选择"}；正确答案：${question.answer.join("、")}<br>
        知识点：${question.knowledge}
      </div>
    `).join("")
    : `<div class="mistake-item">本模块没有错题。</div>`;

  resultPanel.innerHTML = `
    <div class="score-line">
      <div>
        <h2>练习完成</h2>
        <p>已提交 ${activeQuestions.length} 道题。</p>
      </div>
      <strong>${score} / ${activeQuestions.length}</strong>
    </div>
    <h3>错题汇总</h3>
    <div class="mistake-list">${wrongHtml}</div>
  `;
  resultPanel.classList.remove("hidden");
}

prevBtn.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex -= 1;
    renderQuestion();
  }
});

nextBtn.addEventListener("click", () => {
  if (currentIndex < activeQuestions.length - 1) {
    currentIndex += 1;
    renderQuestion();
  }
});

submitBtn.addEventListener("click", submitAnswer);
allPracticeBtn.addEventListener("click", () => startQuiz("all"));
backHomeBtn.addEventListener("click", () => {
  quizView.classList.add("hidden");
  moduleView.classList.remove("hidden");
});

renderHome();
