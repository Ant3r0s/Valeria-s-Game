document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO GLOBAL Y DATOS ---
    const gameState = {
        score: 0,
        language: 'es', // 'es' o 'en'
        // Más adelante aquí guardaremos el avatar
    };

    // --- REFERENCIAS A ELEMENTOS DEL DOM ---
    const scoreValueEl = document.getElementById('score-value');
    const views = document.querySelectorAll('.view');
    const langButtons = document.querySelectorAll('.lang-btn');
    const gameCards = document.querySelectorAll('.game-card');
    const backButtons = document.querySelectorAll('.back-button');

    // Elementos del Reto Matemático
    const mathLevelBtns = document.querySelectorAll('.difficulty-btn');
    const mathLevelSelectionEl = document.getElementById('math-level-selection');
    const mathGameAreaEl = document.getElementById('math-game-area');
    const mathProblemTextEl = document.getElementById('math-problem-text');
    const mathAnswerInputEl = document.getElementById('math-answer-input');
    const mathCheckBtn = document.getElementById('math-check-btn');
    const mathFeedbackTextEl = document.getElementById('math-feedback-text');
    let currentMathAnswer = 0;

    // --- GESTIÓN DE VISTAS Y NAVEGACIÓN ---
    function showView(viewId) {
        views.forEach(view => view.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
    }

    gameCards.forEach(card => {
        if (!card.classList.contains('disabled')) {
            card.addEventListener('click', () => {
                const gameId = card.dataset.game;
                showView(`${gameId}-view`);
            });
        }
    });

    backButtons.forEach(button => {
        button.addEventListener('click', () => showView('main-menu-view'));
    });

    // --- GESTIÓN DE IDIOMA Y PUNTUACIÓN ---
    langButtons.forEach(button => {
        button.addEventListener('click', () => {
            gameState.language = button.dataset.lang;
            langButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            saveState();
            // Aquí más adelante cambiaremos los textos de la UI
            console.log(`Idioma cambiado a: ${gameState.language}`);
        });
    });

    function updateScore(points) {
        gameState.score += points;
        scoreValueEl.textContent = gameState.score;
        saveState();
    }

    // --- GUARDADO Y CARGA DE DATOS ---
    function saveState() {
        localStorage.setItem('valeriaGameState', JSON.stringify(gameState));
    }

    function loadState() {
        const savedState = localStorage.getItem('valeriaGameState');
        if (savedState) {
            Object.assign(gameState, JSON.parse(savedState));
        }
        scoreValueEl.textContent = gameState.score;
        langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === gameState.language);
        });
    }

    // --- LÓGICA DEL JUEGO DE MATEMÁTICAS ---
    mathLevelBtns.forEach(button => {
        button.addEventListener('click', () => {
            const level = button.dataset.level;
            startGameMath(level);
        });
    });

    function startGameMath(level) {
        mathLevelSelectionEl.classList.add('hidden');
        mathGameAreaEl.classList.remove('hidden');
        generateMathProblem(level);
    }

    function generateMathProblem(level) {
        mathAnswerInputEl.value = '';
        mathFeedbackTextEl.textContent = '';
        mathAnswerInputEl.focus();

        const ops = ['+', '-'];
        let maxNum = 10;

        if (level === 'medium') {
            ops.push('*');
            maxNum = 50;
        } else if (level === 'hard') {
            ops.push('*', '/');
            maxNum = 100;
        }

        const op = ops[Math.floor(Math.random() * ops.length)];
        let num1 = Math.floor(Math.random() * maxNum) + 1;
        let num2 = Math.floor(Math.random() * maxNum) + 1;

        if (op === '-') {
            if (num1 < num2) [num1, num2] = [num2, num1]; // Evitar negativos
            currentMathAnswer = num1 - num2;
        } else if (op === '+') {
            currentMathAnswer = num1 + num2;
        } else if (op === '*') {
             if (level === 'medium') { num2 = Math.floor(Math.random() * 9) + 1; } // Multiplicar por 1 cifra
             currentMathAnswer = num1 * num2;
        } else if (op === '/') {
            num2 = Math.floor(Math.random() * 9) + 2; // Dividir por 1 cifra (no 0 ni 1)
            num1 = num2 * (Math.floor(Math.random() * (maxNum / num2)) + 1); // Asegurar que no da decimales
            currentMathAnswer = num1 / num2;
        }
        
        mathProblemTextEl.textContent = `${num1} ${op} ${num2} = ?`;
    }

    function checkMathAnswer() {
        const userAnswer = parseInt(mathAnswerInputEl.value);
        if (userAnswer === currentMathAnswer) {
            mathFeedbackTextEl.textContent = '¡Correcto!';
            mathFeedbackTextEl.className = 'feedback-text correct';
            updateScore(10);
        } else {
            mathFeedbackTextEl.textContent = `¡Casi! La respuesta era ${currentMathAnswer}`;
            mathFeedbackTextEl.className = 'feedback-text incorrect';
            updateScore(-5);
        }
        // Esperamos un poco y generamos la siguiente pregunta
        setTimeout(() => {
            // Re-seleccionamos el nivel desde algún sitio o volvemos a la selección
            // Por ahora, solo generamos otro problema del mismo nivel (simplificado)
            const currentLevel = document.querySelector('.difficulty-btn:focus')?.dataset.level || 'easy';
            generateMathProblem(currentLevel);
        }, 1500);
    }
    
    mathCheckBtn.addEventListener('click', checkMathAnswer);
    mathAnswerInputEl.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            checkMathAnswer();
        }
    });

    // --- INICIALIZACIÓN ---
    function init() {
        loadState();
        showView('main-menu-view');
    }

    init();
});
