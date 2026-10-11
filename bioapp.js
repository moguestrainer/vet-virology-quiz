let allQuestions = [];
let currentQuiz = [];
let currentIndex = 0;
let userAnswers = [];
let score = 0;

const reverseMap = ['A', 'B', 'C', 'D', 'E', 'F'];

document.addEventListener("DOMContentLoaded", () => {
    fetch('bioquiz_bank.json')
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
            console.error("無法載入生化題庫:", error);
            alert("題庫載入失敗！請確認 bioquiz_bank.json 是否已存在於目錄中。");
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
    document.getElementById('subject-tag').innerText = q.subject || "生物化學";
    document.getElementById('question-text').innerText = q.question;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    document.getElementById('explanation-box').style.display = 'none';
    document.getElementById('check-btn').style.display = 'inline-block';
    document.getElementById('check-btn').disabled = false;
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('submit-btn').style.display = 'none';

    if (q.options) {
        let optionEntries = [];

        if (!Array.isArray(q.options) && typeof q.options === 'object') {
            optionEntries = Object.entries(q.options);
        } else if (Array.isArray(q.options)) {
            optionEntries = q.options.map((optText, index) => [reverseMap[index], optText]);
        }

        optionEntries.forEach(([key, optText], index) => {
            const div = document.createElement('div');
            div.className = 'option-block';
            
            let text = optText || '';
            let letterKey = key || reverseMap[index];

            if (text.trim().startsWith(letterKey)) {
                div.innerText = text;
            } else {
                div.innerText = `${letterKey}. ${text}`;
            }

            div.dataset.letter = letterKey;
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
    const selectedLetters = selectedDivs.map(div => div.dataset.letter).sort();
    
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
        const letter = div.dataset.letter;
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
