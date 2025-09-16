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
function renderQuestion() {
  const q = currentQuestions[currentQuestionIndex];
  const questionText = $('#question-text');
  const answersContainer = $('#answers-container');
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

    // restore selection if any
    if (userAnswers[currentQuestionIndex].includes(idx)) input.checked = true;

    input.addEventListener('change', (e) => {
      // If user starts answering, keep whatever flag state the user chose.
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
  const flagBtn = $('#flag-btn');
  const submitBtn = $('#submit-btn');

  prevBtn.disabled = currentQuestionIndex === 0;
  nextBtn.disabled = currentQuestionIndex === currentQuestions.length - 1;

  // Submit is always visible
  submitBtn.classList.remove('hidden');

  // Update flag button text
  flagBtn.textContent = flaggedQuestions.has(currentQuestionIndex) ? 'Unflag Question' : 'Flag Question';
}

// ===== Results & Review =====
function showResults() {
  hide('#quiz');
  show('#results');

  const total = currentQuestions.length;

  // Only consider answered questions that are NOT flagged
  const consideredIdx = [];
  const answeredIdx = [];

  userAnswers.forEach((ua, i) => {
    const answered = ua && ua.length > 0;
    if (answered) answeredIdx.push(i);
    if (answered && !flaggedQuestions.has(i)) consideredIdx.push(i);
  });

  let correctCount = 0;
  let incorrectCount = 0;

  consideredIdx.forEach(i => {
    const q = currentQuestions[i];
    const ua = userAnswers[i] || [];
    const correct = q.correctIndices;
    const isCorrect = ua.length === correct.length && ua.every((v, idx) => v === correct[idx]);
    if (isCorrect) correctCount++;
    else incorrectCount++;
  });

  const answeredCount = answeredIdx.length;
  const pct = consideredIdx.length > 0 ? (correctCount / consideredIdx.length) * 100 : 0;
  const passed = consideredIdx.length > 0 ? pct >= PASS_THRESHOLD : false;

  // Fill UI
  const grade = $('#grade');
  grade.textContent = consideredIdx.length > 0
    ? `Score: ${pct.toFixed(1)}% — ${passed ? 'PASS' : 'FAIL'}`
    : `Score: 0.0% — (No answered questions counted)`;
  grade.className = consideredIdx.length > 0 && passed ? 'pass' : 'fail';

  $('#correct-count').textContent = correctCount;
  $('#incorrect-count').textContent = incorrectCount;
  $('#answered-count').textContent = answeredCount;
  $('#total-count').textContent = total;
}

function showReview() {
  hide('#results');
  show('#review');
  const container = $('#review-container');
  container.innerHTML = '';

  currentQuestions.forEach((q, idx) => {
    const ua = userAnswers[idx] || [];
    const isAnswered = ua.length > 0;
    const isFlagged = flaggedQuestions.has(idx);

    // Show only answered OR flagged
    if (!isAnswered && !isFlagged) return;

    const correct = q.correctIndices;
    const isCorrect = isAnswered && ua.length === correct.length && ua.every((v,i)=>v===correct[i]);

    const item = document.createElement('div');
    item.className = `review-item ${isAnswered ? (isCorrect ? 'correct' : 'incorrect') : ''}`;

    const qText = document.createElement('div');
    qText.className = 'question';
    qText.textContent = q.question + (isFlagged ? ' (Flagged)' : '');
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

      const userSelected = isAnswered && ua.includes(aIdx);
      const isCorrectAns = correct.includes(aIdx);

      if (isAnswered) {
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
      } else if (isFlagged) {
        // Flagged & unanswered: show only the correct answer(s)
        if (isCorrectAns) {
          row.classList.add('correct-answer');
          row.textContent = `✓ ${ans} (Correct answer)`;
        } else {
          row.textContent = ans;
        }
      }

      item.appendChild(row);
    });

    container.appendChild(item);
  });

  if (!container.children.length) {
    const none = document.createElement('div');
    none.className = 'note';
    none.textContent = 'No answered or flagged questions to review.';
    container.appendChild(none);
  }
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
    if (flaggedQuestions.has(currentQuestionIndex)) {
      // Unflag
      flaggedQuestions.delete(currentQuestionIndex);
    } else {
      // Flag: clear any existing answers
      flaggedQuestions.add(currentQuestionIndex);
      userAnswers[currentQuestionIndex] = [];
    }
    renderQuestion(); // refresh inputs (clears checks when flagged)
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
