JavaScript
let allQuestions = [];
let currentQuiz = [];
let currentIndex = 0;
let userAnswers = [];
let score = 0;

const reverseMap = ['A', 'B', 'C', 'D'];

document.addEventListener("DOMContentLoaded", () => {
    // 讀取我們整理好的 JSON 檔案
    // 請確保檔名與您上傳至 GitHub 的檔名完全一致
    fetch('question_bank.json')
        .then(response => response.json())
        .then(data => {
            allQuestions = data;
            document.getElementById('start-btn').addEventListener('click', startQuiz);
        })
        .catch(error => {
            console.error("無法載入題庫:", error);
            alert("題庫載入失敗！請確認 question_bank.json 是否與網頁放在同一個資料夾。");
        });
});

function startQuiz() {
    const countInput = document.getElementById('question-count').value;
    const count = Math.min(countInput, allQuestions.length);

    // 隨機打亂題庫，並選出指定的題數
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

    // 渲染選項
    q.options.forEach((optText, index) => {
        const div = document.createElement('div');
        div.className = 'option-block';
        div.innerText = `${reverseMap[index]}. ${optText}`;
        div.dataset.index = index;
        div.onclick = () => {
            if (!document.getElementById('check-btn').disabled) {
                div.classList.toggle('selected');
            }
        };
        optionsContainer.appendChild(div);
    });

    document.getElementById('check-btn').onclick = checkAnswer;
}

function checkAnswer() {
    const q = currentQuiz[currentIndex];
    const optionsContainer = document.getElementById('options-container');

    // 取得使用者選取的選項字母陣列 (例如 ['A', 'C'])
    const selectedDivs = Array.from(optionsContainer.querySelectorAll('.selected'));
    const selectedLetters = selectedDivs.map(div => reverseMap[div.dataset.index]).sort();

    if (selectedLetters.length === 0) {
        alert("請至少選擇一個答案！");
        return;
    }

    // 取得正確答案陣列並標準化 (例如 "A, C" -> ['A', 'C'])
    const correctLetters = q.answer.split(/[,\s、]+/).filter(Boolean).sort();

    // 比對是否完全正確
    const isCorrect = JSON.stringify(selectedLetters) === JSON.stringify(correctLetters);

    userAnswers.push({
        question: q,
        selected: selectedLetters.join(', '),
        isCorrect: isCorrect
    });

    if (isCorrect) score++;

    // 鎖定按鈕與選項
    document.getElementById('check-btn').disabled = true;
    document.getElementById('check-btn').style.display = 'none';

    // 為選項上色 (綠色正確，紅色錯誤)
    Array.from(optionsContainer.children).forEach(div => {
        const letter = reverseMap[div.dataset.index];
        if (correctLetters.includes(letter)) {
            div.classList.add('correct-ans'); // 應選的標示綠色
        } else if (selectedLetters.includes(letter) && !correctLetters.includes(letter)) {
            div.classList.add('wrong-ans'); // 錯選的標示紅色
        }
    });

    // 顯示詳解
    const explanationBox = document.getElementById('explanation-box');
    explanationBox.innerHTML = `<strong>正確答案：${q.answer}</strong><br><br>${q.explanation}`;
    explanationBox.style.display = 'block';

    // 判斷要顯示「下一題」還是「查看結果」
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
            <p style="font-size: 15px; color: #555; background: #f9f9f9; padding: 10px; border-radius: 4px;">解析：${ans.question.explanation}</p>
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
