import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

document.addEventListener('DOMContentLoaded', () => {
    // --- MÓDULO DE ESTADO Y DATOS ---
    const state = {
        gameState: { score: 0, language: 'es', theme: 'light', settings: { math: { level: 'easy' }, guessWord: { level: 'easy', theme: 'animales' } }, avatar: { owned: ['stich'], active: 'stich' } },
        shopAvatars: [ { id: 'stich', name: 'Experimento', price: 0, path: 'assets/avatar/stich.png' }, { id: 'shrek', name: 'Ogro', price: 150, path: 'assets/avatar/shrek.png' }, { id: 'balerrinna', name: 'Bailarina', price: 250, path: 'assets/avatar/balerrinna.png' }, { id: 'maincraft', name: 'Steve', price: 400, path: 'assets/avatar/maincraft.png' }, { id: 'tung', name: 'Tipo Duro', price: 600, path: 'assets/avatar/tung.png' }, { id: 'kpop', name: 'Idol K-Pop', price: 1000, path: 'assets/avatar/kpop.png' }, ],
        currentMathAnswer: 0, guessWordState: {}, textGenerator: null,
        uiStrings: {
            es: { points: "Puntos:", main_title: "El Nuevo Juego de Valeria", menu_games_title: "Juegos", menu_extras_title: "Extras", game_math: "Reto Matemático", game_guess_word: "Adivina la Palabra", game_shop: "Tienda", game_closet: "Mi Colección", back_button: "&larr; Volver", attempts_left: "Intentos restantes:", settings_title: "⚙️ Ajustes", settings_appearance: "Apariencia", settings_dark_mode: "Modo Oscuro", settings_select_difficulty: "Selecciona dificultad:", settings_easy: "Fácil", settings_medium: "Medio", settings_hard: "Difícil", settings_select_theme: "Selecciona tema:", check_answer: "Comprobar", current_difficulty: "Dificultad:", closet_subtitle: "Selecciona tu avatar activo" },
            en: { points: "Points:", main_title: "Valeria's New Game", menu_games_title: "Games", menu_extras_title: "Extras", game_math: "Math Challenge", game_guess_word: "Guess the Word", game_shop: "Shop", game_closet: "My Collection", back_button: "&larr; Back", attempts_left: "Attempts left:", settings_title: "⚙️ Settings", settings_appearance: "Appearance", settings_dark_mode: "Dark Mode", settings_select_difficulty: "Select difficulty:", settings_easy: "Easy", settings_medium: "Medium", settings_hard: "Hard", settings_select_theme: "Select a theme:", check_answer: "Check", current_difficulty: "Difficulty:", closet_subtitle: "Select your active avatar" }
        }
    };

    // --- MÓDULO DE UI (MANEJO DEL DOM Y RENDERIZADO) ---
    const ui = {
        init() { this.elements = { scoreValueEl: document.getElementById('score-value'), views: document.querySelectorAll('.view'), gameCards: document.querySelectorAll('.game-card'), backButtons: document.querySelectorAll('.back-button'), headerAvatarImg: document.getElementById('header-avatar-img'), mathAvatarImg: document.getElementById('math-avatar-img'), }; this.elements.gameCards.forEach(card => { if (!card.classList.contains('disabled')) { card.addEventListener('click', () => game.switchView(card.dataset.view)); } }); this.elements.backButtons.forEach(button => { button.addEventListener('click', () => this.showView(button.dataset.view)); }); },
        showView(viewId) { this.elements.views.forEach(view => { if (!view.classList.contains('modal')) view.classList.add('hidden'); }); document.getElementById(viewId).classList.remove('hidden'); },
        updateScore() { this.elements.scoreValueEl.textContent = state.gameState.score; },
        updateAvatar() { const activeAvatar = state.shopAvatars.find(a => a.id === state.gameState.avatar.active); if (activeAvatar) { this.elements.headerAvatarImg.src = activeAvatar.path; this.elements.mathAvatarImg.src = activeAvatar.path; } },
        updateTexts() { const lang = state.gameState.language; document.querySelectorAll('[data-i18n-key]').forEach(el => { const key = el.dataset.i18nKey; if (state.uiStrings[lang][key]) el.innerHTML = state.uiStrings[lang][key]; }); }
    };

    // --- MÓDULO DE PERSISTENCIA (LocalStorage) ---
    const persistence = {
        save() { localStorage.setItem('valeriaGameState', JSON.stringify(state.gameState)); },
        load() { const savedState = localStorage.getItem('valeriaGameState'); if (savedState) { const loadedState = JSON.parse(savedState); Object.keys(state.gameState).forEach(key => { if (loadedState[key] !== undefined) { if (typeof state.gameState[key] === 'object' && state.gameState[key] !== null && !Array.isArray(state.gameState[key])) { Object.assign(state.gameState[key], loadedState[key]); } else { state.gameState[key] = loadedState[key]; } } }); } }
    };
    
    // --- MÓDULO DE AJUSTES ---
    const settings = {
        init() { this.elements = { settingsBtn: document.getElementById('settings-btn'), settingsView: document.getElementById('settings-view'), closeSettingsBtn: document.querySelector('#settings-view .close-button'), mathLevelSettingBtns: document.querySelectorAll('#math-level-setting .difficulty-btn'), guessWordLevelSettingBtns: document.querySelectorAll('#guess-word-level-setting .difficulty-btn'), guessWordThemeSettingBtns: document.querySelectorAll('#guess-word-theme-setting .difficulty-btn'), darkModeToggle: document.getElementById('dark-mode-toggle'), langButtons: document.querySelectorAll('.lang-btn') }; this.elements.settingsBtn.addEventListener('click', () => this.open()); this.elements.closeSettingsBtn.addEventListener('click', () => this.close()); this.elements.mathLevelSettingBtns.forEach(btn => btn.addEventListener('click', () => this.setMathLevel(btn.dataset.level))); this.elements.guessWordLevelSettingBtns.forEach(btn => btn.addEventListener('click', () => { state.gameState.settings.guessWord.level = btn.dataset.level; persistence.save(); this.updateUI(); })); this.elements.guessWordThemeSettingBtns.forEach(btn => btn.addEventListener('click', () => { state.gameState.settings.guessWord.theme = btn.dataset.theme; persistence.save(); this.updateUI(); })); this.elements.darkModeToggle.addEventListener('change', () => this.toggleDarkMode()); this.elements.langButtons.forEach(btn => btn.addEventListener('click', () => this.setLanguage(btn.dataset.lang))); },
        open() { this.updateUI(); this.elements.settingsView.classList.remove('hidden'); },
        close() { this.elements.settingsView.classList.add('hidden'); },
        updateUI() { const { math, guessWord } = state.gameState.settings; this.elements.mathLevelSettingBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.level === math.level)); this.elements.guessWordLevelSettingBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.level === guessWord.level)); this.elements.guessWordThemeSettingBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.theme === guessWord.theme)); this.elements.darkModeToggle.checked = state.gameState.theme === 'dark'; },
        applyTheme() { document.body.classList.toggle('dark-mode', state.gameState.theme === 'dark'); },
        setMathLevel(level) { state.gameState.settings.math.level = level; persistence.save(); this.updateUI(); },
        toggleDarkMode() { state.gameState.theme = this.elements.darkModeToggle.checked ? 'dark' : 'light'; this.applyTheme(); persistence.save(); },
        setLanguage(lang) { state.gameState.language = lang; this.updateLangUI(); ui.updateTexts(); persistence.save(); },
        updateLangUI() { this.elements.langButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === state.gameState.language)); }
    };

    // --- MÓDULO ADIVINA LA PALABRA ---
    const guessWordGame = {
        init() { this.elements = { attempts: document.getElementById('guess-word-attempts'), definition: document.getElementById('guess-word-definition'), boxes: document.getElementById('guess-word-boxes'), keyboard: document.getElementById('keyboard-container') }; this.renderKeyboard(); },
        async start() {
            this.elements.definition.innerHTML = '<p>Contactando con la IA...</p>';
            this.elements.keyboard.querySelectorAll('.key').forEach(k => k.disabled = false);
            if (!state.textGenerator) {
                this.elements.definition.innerHTML = '<p>Cargando IA de lenguaje (sólo la primera vez)...</p>';
                state.textGenerator = await pipeline('text-generation', 'Xenova/distilgpt2');
            }
            const { level, theme } = state.gameState.settings.guessWord;
            const lang = state.gameState.language === 'es' ? 'Spanish' : 'English';
            let minLetters, maxLetters;
            if (level === 'easy') { minLetters = 3; maxLetters = 4; } else if (level === 'medium') { minLetters = 5; maxLetters = 7; } else { minLetters = 8; maxLetters = 10; }
            const numLetters = Math.floor(Math.random() * (maxLetters - minLetters + 1)) + minLetters;
            const prompt = `Generate a simple quiz question.\n###\nLanguage: English\nTheme: animals\nLetters: 3\nDefinition: A loyal pet that barks.\nWord: DOG\n###\nLanguage: Spanish\nTheme: comida\nLetters: 5\nDefinition: Una fruta roja y redonda.\nWord: MANZANA\n###\nLanguage: ${lang}\nTheme: ${theme}\nLetters: ${numLetters}\nDefinition:`;
            try {
                const result = await state.textGenerator(prompt, { max_new_tokens: 50 });
                const generatedText = result[0].generated_text.split('###').pop().trim();
                const definitionMatch = generatedText.match(/Definition:(.*?)\nWord:(.*)/s);
                if (!definitionMatch) throw new Error("La IA no devolvió un formato válido.");
                state.guessWordState = { word: definitionMatch[2].trim().toUpperCase(), guessedLetters: new Set(), attempts: 6 };
                this.elements.definition.textContent = definitionMatch[1].trim();
                this.renderBoxes();
                this.updateAttempts();
            } catch (error) { console.error("Error de la IA:", error); this.elements.definition.textContent = 'Error de la IA. Inténtalo de nuevo.'; }
        },
        renderBoxes() { this.elements.boxes.innerHTML = ''; for (const letter of state.guessWordState.word) { const box = document.createElement('div'); box.className = 'letter-box'; if (state.guessWordState.guessedLetters.has(letter)) box.textContent = letter; this.elements.boxes.appendChild(box); } },
        renderKeyboard() { this.elements.keyboard.innerHTML = ''; 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => { const key = document.createElement('button'); key.className = 'key'; key.textContent = letter; key.addEventListener('click', () => this.handleGuess(letter)); this.elements.keyboard.appendChild(key); }); },
        handleGuess(letter) { if (state.guessWordState.attempts <= 0 || state.guessWordState.guessedLetters.has(letter)) return; state.guessWordState.guessedLetters.add(letter); this.elements.keyboard.querySelector(`button:nth-child(${letter.charCodeAt(0) - 64})`).disabled = true; if (state.guessWordState.word.includes(letter)) { this.renderBoxes(); } else { state.guessWordState.attempts--; this.updateAttempts(); } this.checkGameStatus(); },
        updateAttempts() { this.elements.attempts.textContent = state.guessWordState.attempts; },
        checkGameStatus() { const wordSolved = [...state.guessWordState.word].every(letter => state.guessWordState.guessedLetters.has(letter)); if (wordSolved) { this.elements.definition.textContent = `¡CORRECTO! La palabra era ${state.guessWordState.word}`; game.updateScore(25); this.elements.keyboard.querySelectorAll('.key').forEach(key => key.disabled = true); } else if (state.guessWordState.attempts <= 0) { this.elements.definition.textContent = `¡Has perdido! La palabra era ${state.guessWordState.word}`; this.elements.keyboard.querySelectorAll('.key').forEach(key => key.disabled = true); } }
    };
    
    // --- MÓDULOS DE TIENDA, COLECCIÓN Y MATES (Lógica interna sin cambios) ---
    const shop = { elements: {}, init() { this.elements.grid = document.getElementById('shop-items-grid'); this.render(); this.elements.grid.addEventListener('click', (event) => { if (event.target.classList.contains('buy-btn')) this.buy(event.target.dataset.itemId); }); }, render() { this.elements.grid.innerHTML = ''; state.shopAvatars.forEach(avatar => { if (avatar.price === 0) return; const owned = state.gameState.avatar.owned.includes(avatar.id); const canAfford = state.gameState.score >= avatar.price; const itemEl = document.createElement('div'); itemEl.className = 'shop-item'; itemEl.innerHTML = `<div class="shop-item-icon"><img src="${avatar.path}" alt="${avatar.name}"></div><div class="shop-item-name">${avatar.name}</div><div class="shop-item-price">${avatar.price} 🪙</div><button class="buy-btn" data-item-id="${avatar.id}" ${owned || !canAfford ? 'disabled' : ''}>${owned ? 'Adquirido' : 'Comprar'}</button>`; this.elements.grid.appendChild(itemEl); }); }, buy(avatarId) { const avatar = state.shopAvatars.find(a => a.id === avatarId); if (!avatar || state.gameState.avatar.owned.includes(avatarId) || state.gameState.score < avatar.price) return; game.updateScore(-avatar.price); state.gameState.avatar.owned.push(avatarId); state.gameState.avatar.active = avatarId; persistence.save(); this.render(); ui.updateAvatar(); }};
    const closet = { elements: {}, init() { this.elements.grid = document.getElementById('closet-items-grid'); this.render(); this.elements.grid.addEventListener('click', (event) => { if (event.target.classList.contains('equip-btn')) this.setActive(event.target.dataset.itemId); }); }, render() { this.elements.grid.innerHTML = ''; state.gameState.avatar.owned.forEach(avatarId => { const avatar = state.shopAvatars.find(a => a.id === avatarId); const isActive = state.gameState.avatar.active === avatarId; const itemEl = document.createElement('div'); itemEl.className = `shop-item ${isActive ? 'active' : ''}`; itemEl.innerHTML = `<div class="shop-item-icon"><img src="${avatar.path}" alt="${avatar.name}"></div><div class="shop-item-name">${avatar.name}</div><button class="equip-btn" data-item-id="${avatar.id}" ${isActive ? 'disabled' : ''}>${isActive ? 'Seleccionado' : 'Seleccionar'}</button>`; this.elements.grid.appendChild(itemEl); }); }, setActive(avatarId) { state.gameState.avatar.active = avatarId; persistence.save(); this.render(); ui.updateAvatar(); }};
    const mathGame = { elements: {}, init() { this.elements.levelDisplay = document.getElementById('current-math-level'); this.elements.problemText = document.getElementById('math-problem-text'); this.elements.answerInput = document.getElementById('math-answer-input'); this.elements.checkBtn = document.getElementById('math-check-btn'); this.elements.feedbackText = document.getElementById('math-feedback-text'); this.elements.checkBtn.addEventListener('click', () => this.checkAnswer()); this.elements.answerInput.addEventListener('keyup', (event) => { if (event.key === 'Enter') this.checkAnswer(); }); }, start() { const level = state.gameState.settings.math.level; this.elements.levelDisplay.textContent = level; ui.updateAvatar(); this.generateProblem(); }, generateProblem() { const level = state.gameState.settings.math.level; this.elements.answerInput.value = ''; this.elements.feedbackText.textContent = ''; this.elements.answerInput.focus(); const ops = ['+', '-']; let maxNum = 10; if (level === 'medium') { ops.push('*'); maxNum = 50; } else if (level === 'hard') { ops.push('*', '/'); maxNum = 100; } const op = ops[Math.floor(Math.random() * ops.length)]; let num1 = Math.floor(Math.random() * maxNum) + 1; let num2 = Math.floor(Math.random() * maxNum) + 1; if (op === '-') { if (num1 < num2) [num1, num2] = [num2, num1]; state.currentMathAnswer = num1 - num2; } else if (op === '+') { state.currentMathAnswer = num1 + num2; } else if (op === '*') { if (level === 'medium') num2 = Math.floor(Math.random() * 9) + 1; state.currentMathAnswer = num1 * num2; } else if (op === '/') { num2 = Math.floor(Math.random() * 9) + 2; num1 = num2 * (Math.floor(Math.random() * (maxNum / num2)) + 1); state.currentMathAnswer = num1 / num2; } this.elements.problemText.textContent = `${num1} ${op} ${num2} = ?`; }, checkAnswer() { const userAnswer = parseInt(this.elements.answerInput.value); if (isNaN(userAnswer)) { this.elements.feedbackText.textContent = '¡Introduce un número!'; this.elements.feedbackText.className = 'feedback-text incorrect'; return; } if (userAnswer === state.currentMathAnswer) { this.elements.feedbackText.textContent = '¡Correcto!'; this.elements.feedbackText.className = 'feedback-text correct'; game.updateScore(10); } else { this.elements.feedbackText.textContent = `¡Casi! La respuesta era ${state.currentMathAnswer}`; this.elements.feedbackText.className = 'feedback-text incorrect'; game.updateScore(-5); } setTimeout(() => this.generateProblem(), 1500); }};

    // --- CONTROLADOR PRINCIPAL DEL JUEGO ---
    const game = {
        modules: {
            'math-challenge-view': mathGame,
            'guess-word-view': guessWordGame,
            'shop-view': shop,
            'closet-view': closet
        },
        init() {
            persistence.load();
            ui.init();
            settings.init();
            this.updateFullUI();
            ui.showView('main-menu-view');
        },
        switchView(viewId) {
            const module = this.modules[viewId];
            if (module) {
                if (!module.isInitialized) {
                    module.init();
                    module.isInitialized = true;
                }
                if (typeof module.start === 'function') {
                    module.start();
                } else if (typeof module.render === 'function') {
                    module.render();
                }
            }
            ui.showView(viewId);
        },
        updateScore(points) {
            state.gameState.score = Math.max(0, state.gameState.score + points);
            ui.updateScore();
            persistence.save();
        },
        updateFullUI() {
            ui.updateScore();
            ui.updateAvatar();
            settings.applyTheme();
            settings.updateLangUI();
            ui.updateTexts();
        }
    };

    game.init();
});
