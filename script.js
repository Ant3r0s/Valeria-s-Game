document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO GLOBAL Y DATOS ---
    const gameState = {
        score: 0,
        language: 'es',
        settings: {
            math: {
                level: 'easy' // easy, medium, hard
            },
            // Aquí irán los ajustes de los otros juegos
        }
    };

    // --- REFERENCIAS A ELEMENTOS DEL DOM ---
    const scoreValueEl = document.getElementById('score-value');
    const views = document.querySelectorAll('.view');
    const langButtons = document.querySelectorAll('.lang-btn');
    const gameCards = document.querySelectorAll('#main-menu-view .game-card');
    const backButtons = document.querySelectorAll('.back-button');
    
    // Elementos de Ajustes
    const settingsBtn = document.getElementById('settings-btn');
    const settingsView = document.getElementById('settings-view');
    const closeSettingsBtn = document.querySelector('#settings-view .close-button');
    const mathLevelSettingBtns = document.querySelectorAll('#math-level-setting .difficulty-btn');

    // Elementos del Reto Matemático
    const mathGameAreaEl = document.getElementById('math-game-area');
    const currentMathLevelEl = document.getElementById('current-math-level');
    const mathProblemTextEl = document.getElementById('math-problem-text');
    const mathAnswerInputEl = document.getElementById('math-answer-input');
    const mathCheckBtn = document.getElementById('math-check-btn');
    const mathFeedbackTextEl = document.getElementById('math-feedback-text');
    let currentMathAnswer = 0;

    // --- GESTIÓN DE VISTAS Y NAVEGACIÓN ---
    function showView(viewId) {
        views.forEach(view => {
            if (!view.classList.contains('modal')) {
                view.classList.add('hidden');
            }
        });
        document.getElementById(viewId).classList.remove('hidden');
    }

    gameCards.forEach(card => {
        if (!card.classList.contains('disabled')) {
            card.addEventListener('click', () => {
                const gameId = card.dataset.game;
                if (gameId === 'math-challenge') {
                    startGameMath();
                }
                showView(`${gameId}-view`);
            });
        }
    });

    backButtons.forEach(button => {
        button.addEventListener('click', () => showView('main-menu-view'));
    });

    // --- LÓGICA DE AJUSTES ---
    settingsBtn.addEventListener('click', () => {
        updateSettingsUI();
        settingsView.classList.remove('hidden');
    });
    closeSettingsBtn.addEventListener('click', () => settingsView.classList.add('hidden'));

    function updateSettingsUI() {
        // Actualizar selección de nivel de matemáticas
        const currentMathLevel = gameState.settings.math.level;
        mathLevelSettingBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.level === currentMathLevel);
        });
    }

    mathLevelSettingBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            gameState.settings.math.level = btn.dataset.level;
            saveState();
            updateSettingsUI();
        });
    });

    // --- GESTIÓN DE IDIOMA Y PUNTUACIÓN ---
    // (Sin cambios)

    // --- GUARDADO Y CARGA DE DATOS ---
    function saveState() {
        localStorage.setItem('valeriaGameState', JSON.stringify(gameState));
    }

    function loadState() {
        const savedState = localStorage.getItem('valeriaGameState');
        if (savedState) {
            // Hacemos un merge cuidadoso para no perder nuevas propiedades en el futuro
            const loadedState = JSON.parse(savedState);
            if (loadedState.score !== undefined) gameState.score = loadedState.score;
            if (loadedState.language !== undefined) gameState.language = loadedState.language;
            if (loadedState.settings) {
                if (loadedState.settings.math) gameState.settings.math = loadedState.settings.math;
            }
        }
        scoreValueEl.textContent = gameState.score;
        langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === gameState.language);
        });
    }

    // --- LÓGICA DEL JUEGO DE MATEMÁTICAS (MODIFICADA) ---
    function startGameMath() {
        // Leemos la dificultad desde el estado global, no desde los botones
        const level = gameState.settings.math.level;
        currentMathLevelEl.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        generateMathProblem();
    }

    function generateMathProblem() {
        const level = gameState.settings.math.level; // La dificultad viene del estado global

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
            if (num1 < num2) [num1, num2] = [num2, num1];
            currentMathAnswer = num1 - num2;
        } else if (op === '+') {
            currentMathAnswer = num1 + num2;
        } else if (op === '*') {
             if (level === 'medium') { num2 = Math.floor(Math.random() * 9) + 1; }
             currentMathAnswer = num1 * num2;
        } else if (op === '/') {
            num2 = Math.floor(Math.random() * 9) + 2;
            num1 = num2 * (Math.floor(Math.random() * (maxNum / num2)) + 1);
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
        setTimeout(() => {
            generateMathProblem(); // Generamos el siguiente problema con el mismo nivel
        }, 1500);
    }
    
    mathCheckBtn.addEventListener('click', checkMathAnswer);
    mathAnswerInputEl.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') { checkMathAnswer(); }
    });
    
    // --- FUNCIONES COMPARTIDAS SIN CAMBIOS ---
    langButtons.forEach(button => { button.addEventListener('click', () => { gameState.language = button.dataset.lang; langButtons.forEach(btn => btn.classList.remove('active')); button.classList.add('active'); saveState(); console.log(`Idioma cambiado a: ${gameState.language}`); }); });
    function updateScore(points) { gameState.score += points; scoreValueEl.textContent = gameState.score; saveState(); }

    // --- INICIALIZACIÓN ---
    function init() {
        loadState();
        showView('main-menu-view');
    }

    init();
});
