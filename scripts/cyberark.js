// ===== Config (GitHub Pages) =====
const JSON_URL = '/data/questions.json';
const PASS_THRESHOLD = 80;

// ===== State =====
let quizData = [];            // {question, answers[], correctIndices[], isMultiple}
let currentQuestions = [];    // shuffled copy
let currentQuestionIndex = 0;
let userAnswers = [];         // array<array<number>>
let flaggedQuestions = new Set();

// ===== Boot =====
document.addEventListener('DOMContentLoaded', async () => {
  show('#loader');
  try {
    const res = await fetch(JSON_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const parsed = await res.json();

    quizData = normalizeFromSemicolonStrings(parsed);
    if (!quizData.length) throw new Error('No questions found in questions.json');

    initializeQuiz();
    hide('#loader');
    show('#quiz');
  } catch (err) {
    hide('#loader');
    const box = document.querySelector('#load-error');
    box.textContent = `Failed to load questions: ${err.message}. Confirm the file exists at ${JSON_URL}`;
    box.classList.remove('hidden');
    console.error('Quiz JSON load failure:', err);
  }
});

// ===== Normalization (semicolon-separated fields) =====
function normalizeFromSemicolonStrings(items) {
  return items.map(({ question, correct_answer, incorrect_answers }) => {
    const correct = splitSemicolons(correct_answer || '');
    const incorrect = splitSemicolons(incorrect_answers || '');

    const cleanCorrect = correct.filter(Boolean);
    const cleanIncorrect = incorrect.filter(Boolean);

    const answers = [...cleanCorrect, ...cleanIncorrect];   // corrects first
    const correctIndices = cleanCorrect.map((_, i) => i);   // 0..n-1

    return {
      question: (question || '').trim(),
      answers,
      correctIndices,
      isMultiple: cleanCorrect.length > 1
      // image intentionally ignored
    };
  }).filter(q => q.question && q.answers.length > 0);
}

function splitSemicolons(s) {
  return String(s)
    .split(';')
    .map(x => x.trim())
    .filter(x => x.length > 0);
}

// ===== Quiz lifecycle =====
function initializeQuiz() {
  userAnswers = Array(quizData.length).fill(0).map(() => []);
  flaggedQuestions = new Set();

  currentQuestions = quizData.map(q => deepClone(q));
  shuffleArray(currentQuestions);

  // Shuffle answers per question and remap correct indices
  currentQuestions.forEach(q => {
    const original = [...q.answers];
    const shuffled = [...q.answers];
    shuffleArray(shuffled);

    const newCorrect = [];
    q.correctIndices.forEach(oldIdx => {
      const correctAnswer = original[oldIdx];
      const newIdx = shuffled.indexOf(correctAnswer);
      if (newIdx !== -1) newCorrect.push(newIdx);
    });
    newCorrect.sort((a,b)=>a-b);

    q.answers = shuffled;
    q.correctIndices = newCorrect;
  });

  currentQuestionIndex = 0;
  buildQuestionNav();
  renderQuestion();
  updateNavigation();
}

// ===== DOM utils =====
function $(sel){ return document.querySelector(sel); }
function show(sel){ $(sel).classList.remove('hidden'); }
function hide(sel){ $(sel).classList.add('hidden'); }
function deepClone(o){ return JSON.parse(JSON.stringify(o)); }
function shuffleArray(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// ===== Rendering =====
function buildQuestionNav() {
  const nav = $('#question-nav');
  nav.innerHTML = '';
  currentQuestions.forEach((_, idx) => {
    const btn = document.createElement('button');
    btn.className = 'question-nav-btn';
    btn.textContent = idx + 1;
    btn.addEventListener('click', () => {
      currentQuestionIndex = idx;
      renderQuestion();
      updateNavigation();
    });
    nav.appendChild(btn);
  });
}

function renderQuestion() {
  const q = currentQuestions[currentQuestionIndex];
  const questionText = $('#question-text');
  const answersContainer = $('#answers-container'); // <-- fixed here
  const note = $('#question-note');

  questionText.textContent = q.question;

  if (q.isMultiple) {
    note.textContent = '(Select all that apply)';
    note.classList.remove('hidden');
  } else {
    note.textContent = '';
    note.classList.add('hidden');
  }

  answersContainer.innerHTML = '';
  q.answers.forEach((answer, idx) => {
    const id = `answer-${idx}`;
    const input = document.createElement('input');
    input.type = q.isMultiple ? 'checkbox' : 'radio';
    input.name = 'answer';
    input.value = idx;
    input.id = id;

    if (userAnswers[currentQuestionIndex].includes(idx)) input.checked = true;

    input.addEventListener('change', (e) => {
      if (q.isMultiple) {
        if (e.target.checked) {
          if (!userAnswers[currentQuestionIndex].includes(idx)) {
            userAnswers[currentQuestionIndex].push(idx);
          }
        } else {
          const pos = userAnswers[currentQuestionIndex].indexOf(idx);
          if (pos > -1) userAnswers[currentQuestionIndex].splice(pos, 1);
        }
        userAnswers[currentQuestionIndex].sort((a,b)=>a-b);
      } else {
        userAnswers[currentQuestionIndex] = [idx];
      }
      updateNavigation();
    });

    const label = document.createElement('label');
    label.htmlFor = id;
    label.appendChild(input);
    label.appendChild(document.createTextNode(' ' + answer));
    answersContainer.appendChild(label);
  });

  updateNavigation();
}

function updateNavigation() {
  const prevBtn = $('#prev-btn');
  const nextBtn = $('#next-btn');
  const submitBtn = $('#submit-btn');
  const flagBtn = $('#flag-btn');

  prevBtn.disabled = currentQuestionIndex === 0;
  nextBtn.disabled = currentQuestionIndex === currentQuestions.length - 1;

  if (currentQuestionIndex === currentQuestions.length - 1) {
    submitBtn.classList.remove('hidden');
  } else {
    submitBtn.classList.add('hidden');
  }

  flagBtn.textContent = flaggedQuestions.has(currentQuestionIndex) ? 'Unflag Question' : 'Flag Question';

  const navButtons = document.querySelectorAll('.question-nav-btn');
  navButtons.forEach((btn, idx) => {
    btn.classList.remove('current', 'answered', 'flagged');
    if (idx === currentQuestionIndex) btn.classList.add('current');
    if (userAnswers[idx]?.length) btn.classList.add('answered');
    if (flaggedQuestions.has(idx)) btn.classList.add('flagged');
  });
}

// ===== Results & Review =====
function showResults() {
  hide('#quiz');
  show('#results');

  let correctCount = 0;
  userAnswers.forEach((ua, idx) => {
    const q = currentQuestions[idx];
    const c = q.correctIndices;
    if (ua.length === c.length && ua.every((v, i) => v === c[i])) correctCount++;
  });

  const incorrect = userAnswers.length - correctCount;
  const pct = (correctCount / userAnswers.length) * 100;
  const passed = pct >= PASS_THRESHOLD;

  const grade = $('#grade');
  grade.textContent = `Score: ${pct.toFixed(1)}% — ${passed ? 'PASS' : 'FAIL'}`;
  grade.className = passed ? 'pass' : 'fail';

  $('#correct-count').textContent = correctCount;
  $('#incorrect-count').textContent = incorrect;
}

function showReview() {
  hide('#results');
  show('#review');
  const container = $('#review-container');
  container.innerHTML = '';

  currentQuestions.forEach((q, idx) => {
    const ua = userAnswers[idx];
    const c = q.correctIndices;
    const isCorrect = ua.length === c.length && ua.every((v,i)=>v===c[i]);

    const item = document.createElement('div');
    item.className = `review-item ${isCorrect ? 'correct' : 'incorrect'}`;

    const qText = document.createElement('div');
    qText.className = 'question';
    qText.textContent = q.question;
    item.appendChild(qText);

    if (q.isMultiple) {
      const note = document.createElement('div');
      note.className = 'note';
      note.textContent = '(Multiple correct answers required)';
      item.appendChild(note);
    }

    q.answers.forEach((ans, aIdx) => {
      const row = document.createElement('div');
      row.className = 'review-answer';

      const userSelected = ua.includes(aIdx);
      const isCorrectAns = c.includes(aIdx);

      if (userSelected && isCorrectAns) {
        row.classList.add('user-correct');
        row.textContent = `✓ ${ans} (Your correct answer)`;
      } else if (userSelected && !isCorrectAns) {
        row.classList.add('user-incorrect');
        row.textContent = `✗ ${ans} (Your incorrect selection)`;
      } else if (!userSelected && isCorrectAns) {
        row.classList.add('correct-answer');
        row.textContent = `✓ ${ans} (Correct answer)`;
      } else {
        row.textContent = ans;
      }
      item.appendChild(row);
    });

    container.appendChild(item);
  });
}

// ===== Events =====
document.addEventListener('click', (e) => {
  const id = e.target?.id;
  if (id === 'prev-btn' && currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion();
  } else if (id === 'next-btn' && currentQuestionIndex < currentQuestions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
  } else if (id === 'flag-btn') {
    if (flaggedQuestions.has(currentQuestionIndex)) flaggedQuestions.delete(currentQuestionIndex);
    else flaggedQuestions.add(currentQuestionIndex);
    updateNavigation();
  } else if (id === 'submit-btn') {
    showResults();
  } else if (id === 'review-btn') {
    showReview();
  } else if (id === 'retry-btn' || id === 'retry-from-review-btn') {
    hide('#results'); hide('#review'); show('#quiz');
    initializeQuiz();
  }
});
