let allQuestions = [];
let currentQuiz = [];
let currentIndex = 0;
let userAnswers = [];
let score = 0;

const reverseMap = ['A', 'B', 'C', 'D', 'E', 'F'];

document.addEventListener("DOMContentLoaded", () => {
    fetch('question_bank.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('網路回應錯誤: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            allQuestions = data;
            document.getElementById('start-btn').addEventListener('click', startQuiz);
        })
        .catch(error => {
            console.error("無法載入題庫:", error);
            alert("題庫載入失敗！請確認 question_bank.json 是否與網頁放在同一個資料夾，且格式正確。");
        });
});

function startQuiz() {
    const countInput = document.getElementById('question-count').value;
    const count = Math.min(countInput, allQuestions.length);

    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    currentQuiz = shuffled.slice(0, count);

    currentIndex = 0;
    userAnswers = [];
    score = 0;

    switchScreen('quiz-screen');
    loadQuestion();
}

function loadQuestion() {
    const q = currentQuiz[currentIndex];
    document.getElementById('question-counter').innerText = `第 ${currentIndex + 1} 題 / 共 ${currentQuiz.length} 題`;
    document.getElementById('subject-tag').innerText = q.subject || "病毒學";
    document.getElementById('question-text').innerText = q.question;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    document.getElementById('explanation-box').style.display = 'none';
    document.getElementById('check-btn').style.display = 'inline-block';
    document.getElementById('check-btn').disabled = false;
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('submit-btn').style.display = 'none';

    if (q.options && Array.isArray(q.options)) {
        q.options.forEach((optText, index) => {
            const div = document.createElement('div');
            div.className = 'option-block';

            let text = optText || '';
            // 檢查選項文字是否已經開頭帶有 A. B. C. D. 或 (A) (B) 等格式
            const hasPrefix = /^[A-Da-d①-④(（]/.test(text.trim());

            if (hasPrefix) {
                // 如果原本就有帶編號，直接顯示原文字
                div.innerText = text;
            } else {
                // 如果沒有，才自動補上 A. B. C. D.
                const prefix = reverseMap[index] ? reverseMap[index] + '. ' : '';
                div.innerText = prefix + text;
            }

            div.dataset.index = index;
            div.onclick = () => {
                if (!document.getElementById('check-btn').disabled) {
                    div.classList.toggle('selected');
                }
            };
            optionsContainer.appendChild(div);
        });
    } else {
        optionsContainer.innerHTML = '<p style="color: red;">此題選項格式有誤</p>';
    }

    document.getElementById('check-btn').onclick = checkAnswer;
}

function checkAnswer() {
    const q = currentQuiz[currentIndex];
    const optionsContainer = document.getElementById('options-container');

    const selectedDivs = Array.from(optionsContainer.querySelectorAll('.selected'));
    const selectedLetters = selectedDivs.map(div => reverseMap[div.dataset.index]).sort();

    if (selectedLetters.length === 0) {
        alert("請至少選擇一個答案！");
        return;
    }

    const correctLetters = String(q.answer || '').toUpperCase().split(/[,\s、]+/).filter(Boolean).sort();
    const isCorrect = JSON.stringify(selectedLetters) === JSON.stringify(correctLetters);

    userAnswers.push({
        question: q,
        selected: selectedLetters.join(', '),
        isCorrect: isCorrect
    });

    if (isCorrect) score++;

    document.getElementById('check-btn').disabled = true;
    document.getElementById('check-btn').style.display = 'none';

    Array.from(optionsContainer.children).forEach(div => {
        const letter = reverseMap[div.dataset.index];
        if (correctLetters.includes(letter)) {
            div.classList.add('correct-ans');
        } else if (selectedLetters.includes(letter) && !correctLetters.includes(letter)) {
            div.classList.add('wrong-ans');
        }
    });

    const explanationBox = document.getElementById('explanation-box');
    explanationBox.innerHTML = `<strong>正確答案：${q.answer}</strong><br><br>${q.explanation || '無詳細解析'}`;
    explanationBox.style.display = 'block';

    if (currentIndex < currentQuiz.length - 1) {
        document.getElementById('next-btn').style.display = 'inline-block';
        document.getElementById('next-btn').onclick = () => {
            currentIndex++;
            loadQuestion();
        };
    } else {
        document.getElementById('submit-btn').style.display = 'inline-block';
        document.getElementById('submit-btn').onclick = showResult;
    }
}

function showResult() {
    switchScreen('result-screen');
    const percentage = Math.round((score / currentQuiz.length) * 100);
    document.getElementById('final-score').innerText = `總得分：${score} / ${currentQuiz.length} (${percentage} 分)`;

    const reviewContainer = document.getElementById('review-container');
    reviewContainer.innerHTML = '';

    userAnswers.forEach((ans, index) => {
        const item = document.createElement('div');
        item.className = 'result-item';
        const status = ans.isCorrect ? '<span class="correct-text">✔ 答對</span>' : '<span class="incorrect-text">✘ 答錯</span>';

        item.innerHTML = `
            <p><strong>${index + 1}. ${ans.question.question}</strong></p>
            <p>${status} | 您的作答：<strong>${ans.selected}</strong> | 正確答案：<strong>${ans.question.answer}</strong></p>
            <p style="font-size: 15px; color: #555; background: #f9f9f9; padding: 10px; border-radius: 4px;">解析：${ans.question.explanation || '無'}</p>
        `;
        reviewContainer.appendChild(item);
    });
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}
