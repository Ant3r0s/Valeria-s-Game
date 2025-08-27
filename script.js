import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO GLOBAL Y DATOS ---
    const gameState = {
        score: 0,
        language: 'es',
        theme: 'light',
        settings: {
            math: { level: 'easy' },
            guessWord: { level: 'easy', theme: 'animales' },
        },
        avatar: { owned: ['stich'], active: 'stich' }
    };

    // Diccionario para la interfaz multi-idioma
    const uiStrings = {
        es: {
            points: "Puntos:",
            main_title: "El Nuevo Juego de Valeria",
            game_math: "Reto Matemático",
            game_guess_word: "Adivina la Palabra",
            game_shop: "Tienda",
            game_closet: "Mi Colección",
            back_button: "&larr; Volver",
            attempts_left: "Intentos restantes:",
            settings_title: "⚙️ Ajustes del Juego",
            settings_appearance: "Apariencia",
            settings_dark_mode: "Modo Oscuro",
            settings_select_difficulty: "Selecciona la dificultad:",
            settings_easy: "Fácil",
            settings_medium: "Medio",
            settings_hard: "Difícil",
            settings_select_theme: "Selecciona un tema:",
        },
        en: {
            points: "Points:",
            main_title: "Valeria's New Game",
            game_math: "Math Challenge",
            game_guess_word: "Guess the Word",
            game_shop: "Shop",
            game_closet: "My Collection",
            back_button: "&larr; Back",
            attempts_left: "Attempts left:",
            settings_title: "⚙️ Game Settings",
            settings_appearance: "Appearance",
            settings_dark_mode: "Dark Mode",
            settings_select_difficulty: "Select difficulty:",
            settings_easy: "Easy",
            settings_medium: "Medium",
            settings_hard: "Hard",
            settings_select_theme: "Select a theme:",
        }
    };
    
    // --- IA: El Generador de Texto ---
    let textGenerator = null;

    // ... (resto de referencias al DOM, estado de la tienda, etc.)
    const scoreValueEl = document.getElementById('score-value');
    const views = document.querySelectorAll('.view');
    const langButtons = document.querySelectorAll('.lang-btn');
    const gameCards = document.querySelectorAll('#main-menu-view .game-card');
    const backButtons = document.querySelectorAll('.back-button');
    const headerAvatarImg = document.getElementById('header-avatar-img');
    const mathAvatarImg = document.getElementById('math-avatar-img');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsView = document.getElementById('settings-view');
    const closeSettingsBtn = document.querySelector('#settings-view .close-button');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const mathLevelSettingBtns = document.querySelectorAll('#math-level-setting .difficulty-btn');
    const currentMathLevelEl = document.getElementById('current-math-level');
    const mathProblemTextEl = document.getElementById('math-problem-text');
    const mathAnswerInputEl = document.getElementById('math-answer-input');
    const mathCheckBtn = document.getElementById('math-check-btn');
    const mathFeedbackTextEl = document.getElementById('math-feedback-text');
    let currentMathAnswer = 0;
    const shopItemsGrid = document.getElementById('shop-items-grid');
    const closetItemsGrid = document.getElementById('closet-items-grid');
    const shopAvatars = [ { id: 'stich', name: 'Experimento', price: 0, path: 'assets/avatar/stich.png' }, { id: 'shrek', name: 'Ogro del Pantano', price: 150, path: 'assets/avatar/shrek.png' }, { id: 'balerrinna', name: 'Bailarina', price: 250, path: 'assets/avatar/balerrinna.png' }, { id: 'maincraft', name: 'Steve', price: 400, path: 'assets/avatar/maincraft.png' }, { id: 'tung', name: 'Tipo Duro', price: 600, path: 'assets/avatar/tung.png' }, { id: 'kpop', name: 'Idol K-Pop', price: 1000, path: 'assets/avatar/kpop.png' }, ];
    const guessWordLevelSettingBtns = document.querySelectorAll('#guess-word-level-setting .difficulty-btn');
    const guessWordThemeSettingBtns = document.querySelectorAll('#guess-word-theme-setting .difficulty-btn');
    const guessWordAttemptsEl = document.getElementById('guess-word-attempts');
    const guessWordDefinitionEl = document.getElementById('guess-word-definition');
    const guessWordBoxesEl = document.getElementById('guess-word-boxes');
    const keyboardContainerEl = document.getElementById('keyboard-container');
    let guessWordState = {};

    // --- GESTIÓN DE IDIOMA ---
    function updateUIText() {
        const lang = gameState.language;
        document.querySelectorAll('[data-i18n-key]').forEach(el => {
            const key = el.dataset.i18nKey;
            if (uiStrings[lang][key]) {
                el.innerHTML = uiStrings[lang][key];
            }
        });
    }

    // --- GESTIÓN DE VISTAS Y NAVEGACIÓN ---
    // ... (sin cambios)
    
    // --- LÓGICA DE AJUSTES (ACTUALIZADA) ---
    function updateSettingsUI() {
        // Mates
        const mathLevel = gameState.settings.math.level;
        mathLevelSettingBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.level === mathLevel));
        
        // Adivina la Palabra
        const { level, theme } = gameState.settings.guessWord;
        guessWordLevelSettingBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.level === level));
        guessWordThemeSettingBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.theme === theme));
        
        darkModeToggle.checked = gameState.theme === 'dark';
    }
    guessWordLevelSettingBtns.forEach(btn => btn.addEventListener('click', () => { gameState.settings.guessWord.level = btn.dataset.level; saveState(); updateSettingsUI(); }));
    guessWordThemeSettingBtns.forEach(btn => btn.addEventListener('click', () => { gameState.settings.guessWord.theme = btn.dataset.theme; saveState(); updateSettingsUI(); }));

    // --- LÓGICA DE ADIVINA LA PALABRA ---
    async function startGameGuessWord() {
        guessWordDefinitionEl.textContent = 'Contactando con la IA...';
        guessWordBoxesEl.innerHTML = '';
        renderKeyboard();

        if (!textGenerator) {
            guessWordDefinitionEl.textContent = 'Cargando IA de lenguaje (sólo la primera vez)...';
            textGenerator = await pipeline('text-generation', 'Xenova/distilgpt2');
        }

        const { level, theme } = gameState.settings.guessWord;
        const lang = gameState.language === 'es' ? 'Spanish' : 'English';
        
        let minLetters, maxLetters;
        if (level === 'easy') { minLetters = 3; maxLetters = 4; }
        else if (level === 'medium') { minLetters = 5; maxLetters = 7; }
        else { minLetters = 8; maxLetters = 10; }
        const numLetters = Math.floor(Math.random() * (maxLetters - minLetters + 1)) + minLetters;

        const prompt = `Generate a simple quiz question.
###
Language: English
Theme: animals
Letters: 3
Definition: A small pet that meows.
Word: CAT
###
Language: Spanish
Theme: comida
Letters: 5
Definition: Una fruta roja y redonda.
Word: MANZANA
###
Language: ${lang}
Theme: ${theme}
Letters: ${numLetters}
Definition:`;

        try {
            const result = await textGenerator(prompt, { max_new_tokens: 50, num_return_sequences: 1 });
            const generatedText = result[0].generated_text.split('###').pop().trim();
            const definitionMatch = generatedText.match(/Definition:(.*?)\nWord:(.*)/s);
            
            if (!definitionMatch) throw new Error("La IA no devolvió un formato válido.");

            const definition = definitionMatch[1].trim();
            const word = definitionMatch[2].trim().toUpperCase();

            guessWordState = {
                word: word,
                guessedLetters: new Set(),
                attempts: 6,
            };
            
            guessWordDefinitionEl.textContent = definition;
            renderWordBoxes();
            updateAttemptsDisplay();

        } catch (error) {
            console.error("Error de la IA:", error);
            guessWordDefinitionEl.textContent = 'Error de la IA. Inténtalo de nuevo.';
        }
    }

    function renderWordBoxes() {
        guessWordBoxesEl.innerHTML = '';
        for (const letter of guessWordState.word) {
            const box = document.createElement('div');
            box.className = 'letter-box';
            if (guessWordState.guessedLetters.has(letter)) {
                box.textContent = letter;
            }
            guessWordBoxesEl.appendChild(box);
        }
    }

    function renderKeyboard() {
        keyboardContainerEl.innerHTML = '';
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (const letter of alphabet) {
            const key = document.createElement('button');
            key.className = 'key';
            key.textContent = letter;
            key.addEventListener('click', () => handleGuess(letter));

            keyboardContainerEl.appendChild(key);
        }
    }

    function handleGuess(letter) {
        if (guessWordState.attempts <= 0 || guessWordState.guessedLetters.has(letter)) return;
        
        guessWordState.guessedLetters.add(letter);
        document.querySelectorAll('.key').forEach(key => {
            if (key.textContent === letter) key.disabled = true;
        });

        if (guessWordState.word.includes(letter)) {
            renderWordBoxes();
        } else {
            guessWordState.attempts--;
            updateAttemptsDisplay();
        }
        checkGameStatus();
    }

    function updateAttemptsDisplay() {
        guessWordAttemptsEl.textContent = guessWordState.attempts;
    }

    function checkGameStatus() {
        const wordSolved = [...guessWordState.word].every(letter => guessWordState.guessedLetters.has(letter));
        if (wordSolved) {
            guessWordDefinitionEl.textContent = `¡CORRECTO! La palabra era ${guessWordState.word}`;
            updateScore(25);
            keyboardContainerEl.querySelectorAll('.key').forEach(key => key.disabled = true);
        } else if (guessWordState.attempts <= 0) {
            guessWordDefinitionEl.textContent = `¡Has perdido! La palabra era ${guessWordState.word}`;
            keyboardContainerEl.querySelectorAll('.key').forEach(key => key.disabled = true);
        }
    }

    // --- EL RESTO DEL CÓDIGO (mates, tienda, avatar, guardado...) ---
    // (Este código es idéntico a la última versión completa que te pasé.
    // Lo pego aquí para asegurar que tienes el archivo 100% completo y sin errores)
    function showView(viewId) { views.forEach(view => { if (!view.classList.contains('modal')) view.classList.add('hidden'); }); document.getElementById(viewId).classList.remove('hidden'); }
    gameCards.forEach(card => { if (!card.classList.contains('disabled')) { card.addEventListener('click', () => { const gameId = card.dataset.game; if (gameId === 'math-challenge') startGameMath(); if (gameId === 'guess-word') startGameGuessWord(); if (gameId === 'shop') renderShop(); if (gameId === 'closet') renderCloset(); showView(`${gameId}-view`); }); } });
    backButtons.forEach(button => { button.addEventListener('click', () => showView('main-menu-view')); });
    settingsBtn.addEventListener('click', () => { updateSettingsUI(); settingsView.classList.remove('hidden'); });
    closeSettingsBtn.addEventListener('click', () => settingsView.classList.add('hidden'));
    mathLevelSettingBtns.forEach(btn => { btn.addEventListener('click', () => { gameState.settings.math.level = btn.dataset.level; saveState(); updateSettingsUI(); }); });
    darkModeToggle.addEventListener('change', () => { gameState.theme = darkModeToggle.checked ? 'dark' : 'light'; applyTheme(); saveState(); });
    function applyTheme() { document.body.classList.toggle('dark-mode', gameState.theme === 'dark'); }
    function renderShop() { shopItemsGrid.innerHTML = ''; shopAvatars.forEach(avatar => { if (avatar.price === 0) return; const owned = gameState.avatar.owned.includes(avatar.id); const canAfford = gameState.score >= avatar.price; const itemEl = document.createElement('div'); itemEl.className = 'shop-item'; itemEl.innerHTML = `<div class="shop-item-icon"><img src="${avatar.path}" alt="${avatar.name}"></div><div class="shop-item-name">${avatar.name}</div><div class="shop-item-price">${avatar.price} 🪙</div><button class="buy-btn" data-item-id="${avatar.id}" ${owned || !canAfford ? 'disabled' : ''}>${owned ? 'Adquirido' : 'Comprar'}</button>`; shopItemsGrid.appendChild(itemEl); }); }
    shopItemsGrid.addEventListener('click', (event) => { if (event.target.classList.contains('buy-btn')) { buyAvatar(event.target.dataset.itemId); } });
    function buyAvatar(avatarId) { const avatar = shopAvatars.find(a => a.id === avatarId); if (!avatar || gameState.avatar.owned.includes(avatarId) || gameState.score < avatar.price) return; updateScore(-avatar.price); gameState.avatar.owned.push(avatarId); gameState.avatar.active = avatarId; saveState(); renderShop(); renderAvatar(); }
    function renderCloset() { closetItemsGrid.innerHTML = ''; gameState.avatar.owned.forEach(avatarId => { const avatar = shopAvatars.find(a => a.id === avatarId); const isActive = gameState.avatar.active === avatarId; const itemEl = document.createElement('div'); itemEl.className = `shop-item ${isActive ? 'active' : ''}`; itemEl.innerHTML = `<div class="shop-item-icon"><img src="${avatar.path}" alt="${avatar.name}"></div><div class="shop-item-name">${avatar.name}</div><button class="equip-btn" data-item-id="${avatar.id}" ${isActive ? 'disabled' : ''}>${isActive ? 'Seleccionado' : 'Seleccionar'}</button>`; closetItemsGrid.appendChild(itemEl); }); }
    closetItemsGrid.addEventListener('click', (event) => { if (event.target.classList.contains('equip-btn')) { setActiveAvatar(event.target.dataset.itemId); } });
    function setActiveAvatar(avatarId) { gameState.avatar.active = avatarId; saveState(); renderCloset(); renderAvatar(); }
    function renderAvatar() { const activeAvatar = shopAvatars.find(a => a.id === gameState.avatar.active); if (activeAvatar) { headerAvatarImg.src = activeAvatar.path; mathAvatarImg.src = activeAvatar.path; } else { const fallbackAvatar = shopAvatars[0]; headerAvatarImg.src = fallbackAvatar.path; mathAvatarImg.src = fallbackAvatar.path; } }
    function saveState() { localStorage.setItem('valeriaGameState', JSON.stringify(gameState)); }
    function loadState() { const savedState = localStorage.getItem('valeriaGameState'); if (savedState) { const loadedState = JSON.parse(savedState); gameState.score = loadedState.score || 0; gameState.language = loadedState.language || 'es'; gameState.theme = loadedState.theme || 'light'; if (loadedState.settings) { gameState.settings.math = loadedState.settings.math || {level: 'easy'}; gameState.settings.guessWord = loadedState.settings.guessWord || {level: 'easy', theme: 'animales'}; } gameState.avatar = loadedState.avatar || { owned: ['stich'], active: 'stich' }; } updateUI(); applyTheme(); }
    function updateUI() { scoreValueEl.textContent = gameState.score; langButtons.forEach(btn => { btn.classList.toggle('active', btn.dataset.lang === gameState.language); }); renderAvatar(); updateUIText(); }
    function startGameMath() { const level = gameState.settings.math.level; currentMathLevelEl.textContent = level.charAt(0).toUpperCase() + level.slice(1); renderAvatar(); generateMathProblem(); }
    function generateMathProblem() { const level = gameState.settings.math.level; mathAnswerInputEl.value = ''; mathFeedbackTextEl.textContent = ''; mathAnswerInputEl.focus(); const ops = ['+', '-']; let maxNum = 10; if (level === 'medium') { ops.push('*'); maxNum = 50; } else if (level === 'hard') { ops.push('*', '/'); maxNum = 100; } const op = ops[Math.floor(Math.random() * ops.length)]; let num1 = Math.floor(Math.random() * maxNum) + 1; let num2 = Math.floor(Math.random() * maxNum) + 1; if (op === '-') { if (num1 < num2) [num1, num2] = [num2, num-1]; currentMathAnswer = num1 - num2; } else if (op === '+') { currentMathAnswer = num1 + num2; } else if (op === '*') { if (level === 'medium') num2 = Math.floor(Math.random() * 9) + 1; currentMathAnswer = num1 * num2; } else if (op === '/') { num2 = Math.floor(Math.random() * 9) + 2; num1 = num2 * (Math.floor(Math.random() * (maxNum / num2)) + 1); currentMathAnswer = num1 / num2; } mathProblemTextEl.textContent = `${num1} ${op} ${num2} = ?`; }
    function checkMathAnswer() { const userAnswer = parseInt(mathAnswerInputEl.value); if (isNaN(userAnswer)) { mathFeedbackTextEl.textContent = '¡Introduce un número!'; mathFeedbackTextEl.className = 'feedback-text incorrect'; return; } if (userAnswer === currentMathAnswer) { mathFeedbackTextEl.textContent = '¡Correcto!'; mathFeedbackTextEl.className = 'feedback-text correct'; updateScore(10); } else { mathFeedbackTextEl.textContent = `¡Casi! La respuesta era ${currentMathAnswer}`; mathFeedbackTextEl.className = 'feedback-text incorrect'; updateScore(-5); } setTimeout(generateMathProblem, 1500); }
    mathCheckBtn.addEventListener('click', checkMathAnswer);
    mathAnswerInputEl.addEventListener('keyup', (event) => { if (event.key === 'Enter') checkMathAnswer(); });
    langButtons.forEach(button => { button.addEventListener('click', () => { gameState.language = button.dataset.lang; updateUI(); saveState(); }); });
    function updateScore(points) { gameState.score = Math.max(0, gameState.score + points); scoreValueEl.textContent = gameState.score; saveState(); }
    function init() { loadState(); showView('main-menu-view'); }
    init();
});
