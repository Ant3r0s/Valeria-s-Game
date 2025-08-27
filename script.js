document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO GLOBAL Y DATOS ---
    const gameState = {
        score: 0,
        language: 'es',
        theme: 'light',
        settings: {
            math: { level: 'easy' },
            wordGuess: { difficulty: 'easy', theme: 'animals' }
        },
        avatar: {
            owned: ['stich'],
            active: 'stich',
        }
    };

    const shopAvatars = [
        { id: 'stich', name: 'Experimento', price: 0, path: 'assets/avatar/stich.png' },
        { id: 'shrek', name: 'Ogro', price: 150, path: 'assets/avatar/shrek.png' }, // Nombre acortado
        { id: 'balerrinna', name: 'Bailarina', price: 250, path: 'assets/avatar/balerrinna.png' },
        { id: 'maincraft', name: 'Steve', price: 400, path: 'assets/avatar/maincraft.png' },
        { id: 'tung', name: 'Tipo Duro', price: 600, path: 'assets/avatar/tung.png' },
        { id: 'kpop', name: 'Idol K-Pop', price: 1000, path: 'assets/avatar/kpop.png' },
    ];

    // Palabras para "Adivina la Palabra" (en inglés)
    const wordList = {
        easy: {
            animals: ['cat', 'dog', 'fish', 'bird', 'cow'],
            fruits: ['apple', 'pear', 'grape', 'kiwi', 'plum'],
            countries: ['usa', 'uk', 'spain', 'italy', 'japan']
        },
        medium: {
            animals: ['tiger', 'zebra', 'mouse', 'horse', 'snake'],
            fruits: ['banana', 'orange', 'cherry', 'mango', 'lemon'],
            countries: ['france', 'brazil', 'india', 'china', 'canada']
        },
        hard: {
            animals: ['elephant', 'giraffe', 'octopus', 'kangaroo', 'penguin'],
            fruits: ['pineapple', 'blueberry', 'strawberry', 'watermelon', 'grapefruit'],
            countries: ['argentina', 'mexico', 'germany', 'australia', 'egypt']
        }
    };

    // --- REFERENCIAS A ELEMENTOS DEL DOM ---
    const scoreValueEl = document.getElementById('score-value');
    const views = document.querySelectorAll('.view');
    const langButtons = document.querySelectorAll('.lang-btn');
    const gameCards = document.querySelectorAll('#main-menu-view .game-card');
    const backButtons = document.querySelectorAll('.back-button');
    const headerAvatarImg = document.getElementById('header-avatar-img');
    const mathAvatarImg = document.getElementById('math-avatar-img');
    const wordGuessAvatarImg = document.getElementById('word-guess-avatar-img'); // Nuevo
    
    const settingsBtn = document.getElementById('settings-btn');
    const settingsView = document.getElementById('settings-view');
    const closeSettingsBtn = document.querySelector('#settings-view .close-button');
    const mathLevelSettingBtns = document.querySelectorAll('#math-level-setting .difficulty-btn');
    const wordGuessDifficultySettingBtns = document.querySelectorAll('#word-guess-difficulty-setting .difficulty-btn'); // Nuevo
    const wordGuessThemeSettingBtns = document.querySelectorAll('#word-guess-theme-setting .difficulty-btn'); // Nuevo
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    const currentMathLevelEl = document.getElementById('current-math-level');
    const mathProblemTextEl = document.getElementById('math-problem-text');
    const mathAnswerInputEl = document.getElementById('math-answer-input');
    const mathCheckBtn = document.getElementById('math-check-btn');
    const mathFeedbackTextEl = document.getElementById('math-feedback-text');
    let currentMathAnswer = 0;

    const shopItemsGrid = document.getElementById('shop-items-grid');
    const closetItemsGrid = document.getElementById('closet-items-grid');

    const currentWordGuessDifficultyEl = document.getElementById('current-word-guess-difficulty'); // Nuevo
    const wordDisplayGrid = document.getElementById('word-display-grid'); // Nuevo
    const wordGuessInputEl = document.getElementById('word-guess-input'); // Nuevo
    const wordGuessCheckBtn = document.getElementById('word-guess-check-btn'); // Nuevo
    const wordGuessFeedbackTextEl = document.getElementById('word-guess-feedback-text'); // Nuevo
    let currentWord = ''; // Palabra actual para adivinar
    let guessedLetters = []; // Letras ya adivinadas
    let maxAttempts = 5; // Intentos máximos para adivinar la palabra completa
    let remainingAttempts = maxAttempts;

    // --- GESTIÓN DE VISTAS Y NAVEGACIÓN ---
    function showView(viewId) {
        views.forEach(view => {
            if (!view.classList.contains('modal')) view.classList.add('hidden');
        });
        document.getElementById(viewId).classList.remove('hidden');
    }

    gameCards.forEach(card => {
        if (!card.classList.contains('disabled')) {
            card.addEventListener('click', () => {
                const gameId = card.dataset.game;
                if (gameId === 'math-challenge') startGameMath();
                if (gameId === 'word-guess') startGameWordGuess(); // Nuevo juego
                if (gameId === 'shop') renderShop();
                if (gameId === 'closet') renderCloset();
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
        const currentMathLevel = gameState.settings.math.level;
        mathLevelSettingBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.level === currentMathLevel);
        });

        const currentWordGuessDifficulty = gameState.settings.wordGuess.difficulty;
        wordGuessDifficultySettingBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.level === currentWordGuessDifficulty);
        });

        const currentWordGuessTheme = gameState.settings.wordGuess.theme;
        wordGuessThemeSettingBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === currentWordGuessTheme);
        });

        darkModeToggle.checked = gameState.theme === 'dark';
    }

    mathLevelSettingBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            gameState.settings.math.level = btn.dataset.level;
            saveState();
            updateSettingsUI();
        });
    });

    wordGuessDifficultySettingBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            gameState.settings.wordGuess.difficulty = btn.dataset.level;
            saveState();
            updateSettingsUI();
        });
    });

    wordGuessThemeSettingBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            gameState.settings.wordGuess.theme = btn.dataset.theme;
            saveState();
            updateSettingsUI();
        });
    });

    darkModeToggle.addEventListener('change', () => {
        gameState.theme = darkModeToggle.checked ? 'dark' : 'light';
        applyTheme();
        saveState();
    });

    function applyTheme() {
        document.body.classList.toggle('dark-mode', gameState.theme === 'dark');
    }

    // --- LÓGICA DE TIENDA, ARMARIO Y AVATAR ---
    function renderShop() {
        shopItemsGrid.innerHTML = '';
        shopAvatars.forEach(avatar => {
            if (avatar.price === 0) return;
            const owned = gameState.avatar.owned.includes(avatar.id);
            const canAfford = gameState.score >= avatar.price;
            const itemEl = document.createElement('div');
            itemEl.className = 'shop-item';
            itemEl.innerHTML = `
                <div class="shop-item-icon"><img src="${avatar.path}" alt="${avatar.name}"></div>
                <div class="shop-item-name">${avatar.name}</div>
                <div class="shop-item-price">${avatar.price} 🪙</div>
                <button class="buy-btn" data-item-id="${avatar.id}" ${owned || !canAfford ? 'disabled' : ''}>
                    ${owned ? 'Adquirido' : 'Comprar'}
                </button>
            `;
            shopItemsGrid.appendChild(itemEl);
        });
    }

    shopItemsGrid.addEventListener('click', (event) => {
        if (event.target.classList.contains('buy-btn')) {
            buyAvatar(event.target.dataset.itemId);
        }
    });

    function buyAvatar(avatarId) {
        const avatar = shopAvatars.find(a => a.id === avatarId);
        if (!avatar || gameState.avatar.owned.includes(avatarId) || gameState.score < avatar.price) return;
        updateScore(-avatar.price);
        gameState.avatar.owned.push(avatarId);
        gameState.avatar.active = avatarId;
        saveState();
        renderShop();
        renderAvatar();
    }

    function renderCloset() {
        closetItemsGrid.innerHTML = '';
        gameState.avatar.owned.forEach(avatarId => {
            const avatar = shopAvatars.find(a => a.id === avatarId);
            const isActive = gameState.avatar.active === avatarId;
            const itemEl = document.createElement('div');
            itemEl.className = `shop-item ${isActive ? 'active' : ''}`;
            itemEl.innerHTML = `
                <div class="shop-item-icon"><img src="${avatar.path}" alt="${avatar.name}"></div>
                <div class="shop-item-name">${avatar.name}</div>
                <button class="equip-btn" data-item-id="${avatar.id}" ${isActive ? 'disabled' : ''}>
                    ${isActive ? 'Seleccionado' : 'Seleccionar'}
                </button>
            `;
            closetItemsGrid.appendChild(itemEl);
        });
    }

    closetItemsGrid.addEventListener('click', (event) => {
        if (event.target.classList.contains('equip-btn')) {
            setActiveAvatar(event.target.dataset.itemId);
        }
    });

    function setActiveAvatar(avatarId) {
        gameState.avatar.active = avatarId;
        saveState();
        renderCloset();
        renderAvatar();
    }

    function renderAvatar() {
        const activeAvatar = shopAvatars.find(a => a.id === gameState.avatar.active);
        if (activeAvatar) {
            headerAvatarImg.src = activeAvatar.path;
            mathAvatarImg.src = activeAvatar.path;
            wordGuessAvatarImg.src = activeAvatar.path; // Actualiza el avatar en el nuevo juego
        } else {
            const fallbackAvatar = shopAvatars[0];
            headerAvatarImg.src = fallbackAvatar.path;
            mathAvatarImg.src = fallbackAvatar.path;
            wordGuessAvatarImg.src = fallbackAvatar.path;
        }
    }

    // --- GUARDADO Y CARGA DE DATOS ---
    function saveState() { localStorage.setItem('valeriaGameState', JSON.stringify(gameState)); }
    function loadState() {
        const savedState = localStorage.getItem('valeriaGameState');
        if (savedState) {
            const loadedState = JSON.parse(savedState);
            gameState.score = loadedState.score || 0;
            gameState.language = loadedState.language || 'es';
            gameState.theme = loadedState.theme || 'light';
            // Asegurar que settings y sus subpropiedades existen
            gameState.settings = loadedState.settings || { math: { level: 'easy' }, wordGuess: { difficulty: 'easy', theme: 'animals' } };
            gameState.settings.math = loadedState.settings.math || { level: 'easy' };
            gameState.settings.wordGuess = loadedState.settings.wordGuess || { difficulty: 'easy', theme: 'animals' };
            // Asegurar que avatar y sus arrays existen
            gameState.avatar = loadedState.avatar || { owned: ['stich'], active: 'stich' };
            gameState.avatar.owned = gameState.avatar.owned || ['stich'];
            gameState.avatar.active = gameState.avatar.active || 'stich';
        }
        updateUI();
        applyTheme();
    }
    function updateUI() {
        scoreValueEl.textContent = gameState.score;
        renderAvatar();
    }
    
    // --- LÓGICA DEL JUEGO DE MATEMÁTICAS ---
    function startGameMath() {
        const level = gameState.settings.math.level;
        currentMathLevelEl.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        renderAvatar();
        generateMathProblem();
    }
    function generateMathProblem() {
        const level = gameState.settings.math.level;
        mathAnswerInputEl.value = '';
        mathFeedbackTextEl.textContent = '';
        mathAnswerInputEl.focus();
        const ops = ['+', '-'];
        let maxNum = 10;
        if (level === 'medium') { ops.push('*'); maxNum = 50; }
        else if (level === 'hard') { ops.push('*', '/'); maxNum = 100; }
        const op = ops[Math.floor(Math.random() * ops.length)];
        let num1 = Math.floor(Math.random() * maxNum) + 1;
        let num2 = Math.floor(Math.random() * maxNum) + 1;
        if (op === '-') { if (num1 < num2) [num1, num2] = [num2, num1]; currentMathAnswer = num1 - num2; }
        else if (op === '+') { currentMathAnswer = num1 + num2; }
        else if (op === '*') { if (level === 'medium') num2 = Math.floor(Math.random() * 9) + 1; currentMathAnswer = num1 * num2; }
        else if (op === '/') { num2 = Math.floor(Math.random() * 9) + 2; num1 = num2 * (Math.floor(Math.random() * (maxNum / num2)) + 1); currentMathAnswer = num1 / num2; }
        mathProblemTextEl.textContent = `${num1} ${op} ${num2} = ?`;
    }
    function checkMathAnswer() {
        const userAnswer = parseInt(mathAnswerInputEl.value);
        if (isNaN(userAnswer)) {
            mathFeedbackTextEl.textContent = '¡Introduce un número!';
            mathFeedbackTextEl.className = 'feedback-text incorrect';
            return;
        }
        if (userAnswer === currentMathAnswer) {
            mathFeedbackTextEl.textContent = '¡Correcto!';
            mathFeedbackTextEl.className = 'feedback-text correct';
            updateScore(10);
        } else {
            mathFeedbackTextEl.textContent = `¡Casi! La respuesta era ${currentMathAnswer}`;
            mathFeedbackTextEl.className = 'feedback-text incorrect';
            updateScore(-5);
        }
        setTimeout(generateMathProblem, 1500);
    }
    mathCheckBtn.addEventListener('click', checkMathAnswer);
    mathAnswerInputEl.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') checkMathAnswer();
    });
    
    // --- LÓGICA DEL JUEGO "ADIVINA LA PALABRA" ---
    function startGameWordGuess() {
        const difficulty = gameState.settings.wordGuess.difficulty;
        const theme = gameState.settings.wordGuess.theme;
        currentWordGuessDifficultyEl.textContent = `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} - ${theme.charAt(0).toUpperCase() + theme.slice(1)}`;
        renderAvatar();
        generateWordGuessProblem();
    }

    function generateWordGuessProblem() {
        const difficulty = gameState.settings.wordGuess.difficulty;
        const theme = gameState.settings.wordGuess.theme;
        const availableWords = wordList[difficulty][theme];
        currentWord = availableWords[Math.floor(Math.random() * availableWords.length)].toLowerCase();
        guessedLetters = [];
        remainingAttempts = maxAttempts;
        wordGuessInputEl.value = '';
        wordGuessFeedbackTextEl.textContent = '';
        wordGuessInputEl.focus();
        renderWordDisplay();
    }

    function renderWordDisplay() {
        wordDisplayGrid.innerHTML = '';
        currentWord.split('').forEach(letter => {
            const letterBox = document.createElement('div');
            letterBox.className = 'letter-box';
            letterBox.textContent = guessedLetters.includes(letter) ? letter : '';
            wordDisplayGrid.appendChild(letterBox);
        });
    }

    function checkWordGuessAttempt() {
        const input = wordGuessInputEl.value.toLowerCase().trim();
        wordGuessInputEl.value = '';
        wordGuessFeedbackTextEl.textContent = ''; // Limpiar feedback anterior
        
        if (!input) return;

        if (input.length === 1) { // El usuario adivinó una sola letra
            if (guessedLetters.includes(input)) {
                wordGuessFeedbackTextEl.textContent = `Ya has intentado la letra "${input}".`;
                wordGuessFeedbackTextEl.className = 'feedback-text';
            } else {
                guessedLetters.push(input);
                if (currentWord.includes(input)) {
                    wordGuessFeedbackTextEl.textContent = `¡"${input}" es correcta!`;
                    wordGuessFeedbackTextEl.className = 'feedback-text correct';
                    updateScore(5);
                } else {
                    wordGuessFeedbackTextEl.textContent = `¡"${input}" es incorrecta!`;
                    wordGuessFeedbackTextEl.className = 'feedback-text incorrect';
                    updateScore(-2);
                }
                renderWordDisplay();
            }
        } else { // El usuario intentó adivinar la palabra completa
            if (input === currentWord) {
                wordGuessFeedbackTextEl.textContent = `¡Correcto! La palabra era "${currentWord.toUpperCase()}"`;
                wordGuessFeedbackTextEl.className = 'feedback-text correct';
                updateScore(20);
                guessedLetters = currentWord.split(''); // Mostrar toda la palabra
                renderWordDisplay();
                setTimeout(generateWordGuessProblem, 2000);
                return;
            } else {
                remainingAttempts--;
                wordGuessFeedbackTextEl.textContent = `¡Incorrecto! Te quedan ${remainingAttempts} intentos.`;
                wordGuessFeedbackTextEl.className = 'feedback-text incorrect';
                updateScore(-10);
            }
        }

        const allLettersGuessed = currentWord.split('').every(letter => guessedLetters.includes(letter));
        if (allLettersGuessed) {
            wordGuessFeedbackTextEl.textContent = `¡Felicidades! Adivinaste la palabra "${currentWord.toUpperCase()}"`;
            wordGuessFeedbackTextEl.className = 'feedback-text correct';
            updateScore(20);
            setTimeout(generateWordGuessProblem, 2000);
        } else if (remainingAttempts <= 0 && input.length > 1) { // Solo si falla la palabra completa y no quedan intentos
            wordGuessFeedbackTextEl.textContent = `¡Perdiste! La palabra era "${currentWord.toUpperCase()}"`;
            wordGuessFeedbackTextEl.className = 'feedback-text incorrect';
            updateScore(-15);
            setTimeout(generateWordGuessProblem, 2000);
        }
        wordGuessInputEl.focus();
    }

    wordGuessCheckBtn.addEventListener('click', checkWordGuessAttempt);
    wordGuessInputEl.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') checkWordGuessAttempt();
    });

    // --- OTRAS FUNCIONES ---
    langButtons.forEach(button => { button.addEventListener('click', () => { gameState.language = button.dataset.lang; langButtons.forEach(btn => btn.classList.remove('active')); button.classList.add('active'); saveState(); }); });
    function updateScore(points) { gameState.score = Math.max(0, gameState.score + points); scoreValueEl.textContent = gameState.score; saveState(); }
    
    // --- INICIALIZACIÓN ---
    function init() {
        loadState();
        showView('main-menu-view');
    }
    init();
});
