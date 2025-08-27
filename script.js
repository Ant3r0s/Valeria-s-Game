document.addEventListener('DOMContentLoaded', () => {
    // --- MÓDULO DE ESTADO Y DATOS ---
    const state = {
        gameState: {
            score: 0,
            language: 'es',
            theme: 'light',
            settings: { math: { level: 'easy' } },
            avatar: { owned: ['stich'], active: 'stich' }
        },
        shopAvatars: [
            { id: 'stich', name: 'Experimento', price: 0, path: 'assets/avatar/stich.png' },
            { id: 'shrek', name: 'Ogro del Pantano', price: 150, path: 'assets/avatar/shrek.png' },
            { id: 'balerrinna', name: 'Bailarina', price: 250, path: 'assets/avatar/balerrinna.png' },
            { id: 'maincraft', name: 'Steve', price: 400, path: 'assets/avatar/maincraft.png' },
            { id: 'tung', name: 'Tipo Duro', price: 600, path: 'assets/avatar/tung.png' },
            { id: 'kpop', name: 'Idol K-Pop', price: 1000, path: 'assets/avatar/kpop.png' },
        ],
        currentMathAnswer: 0
    };

    // --- MÓDULO DE UI (MANEJO DEL DOM Y RENDERIZADO) ---
    const ui = {
        elements: {
            scoreValueEl: document.getElementById('score-value'),
            views: document.querySelectorAll('.view'),
            headerAvatarImg: document.getElementById('header-avatar-img'),
            mathAvatarImg: document.getElementById('math-avatar-img'),
            mainMenu: {
                gameCards: document.querySelectorAll('#main-menu-view .game-card'),
            },
            allBackButtons: document.querySelectorAll('.back-button'),
        },
        
        showView(viewId) {
            this.elements.views.forEach(view => {
                if (!view.classList.contains('modal')) view.classList.add('hidden');
            });
            document.getElementById(viewId).classList.remove('hidden');
        },

        updateScore() {
            this.elements.scoreValueEl.textContent = state.gameState.score;
        },
        
        updateAvatar() {
            const activeAvatar = state.shopAvatars.find(a => a.id === state.gameState.avatar.active);
            if (activeAvatar) {
                this.elements.headerAvatarImg.src = activeAvatar.path;
                this.elements.mathAvatarImg.src = activeAvatar.path;
            }
        }
    };

    // --- MÓDULO DE PERSISTENCIA (LocalStorage) ---
    const persistence = {
        save() {
            localStorage.setItem('valeriaGameState', JSON.stringify(state.gameState));
        },
        load() {
            const savedState = localStorage.getItem('valeriaGameState');
            if (savedState) {
                const loadedState = JSON.parse(savedState);
                Object.assign(state.gameState, loadedState);
            }
        }
    };
    
    // --- MÓDULO DE AJUSTES ---
    const settings = {
        elements: {},
        init() {
            this.elements.settingsBtn = document.getElementById('settings-btn');
            this.elements.settingsView = document.getElementById('settings-view');
            this.elements.closeSettingsBtn = document.querySelector('#settings-view .close-button');
            this.elements.mathLevelSettingBtns = document.querySelectorAll('#math-level-setting .difficulty-btn');
            this.elements.darkModeToggle = document.getElementById('dark-mode-toggle');
            this.elements.langButtons = document.querySelectorAll('.lang-btn');

            this.elements.settingsBtn.addEventListener('click', () => this.open());
            this.elements.closeSettingsBtn.addEventListener('click', () => this.close());
            this.elements.mathLevelSettingBtns.forEach(btn => btn.addEventListener('click', () => this.setMathLevel(btn.dataset.level)));
            this.elements.darkModeToggle.addEventListener('change', () => this.toggleDarkMode());
            this.elements.langButtons.forEach(btn => btn.addEventListener('click', () => this.setLanguage(btn.dataset.lang)));
            
            this.applyTheme();
            this.updateLangUI();
        },
        open() { this.updateUI(); this.elements.settingsView.classList.remove('hidden'); },
        close() { this.elements.settingsView.classList.add('hidden'); },
        updateUI() {
            const { math } = state.gameState.settings;
            this.elements.mathLevelSettingBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.level === math.level));
            this.elements.darkModeToggle.checked = state.gameState.theme === 'dark';
        },
        applyTheme() { document.body.classList.toggle('dark-mode', state.gameState.theme === 'dark'); },
        setMathLevel(level) { state.gameState.settings.math.level = level; persistence.save(); this.updateUI(); },
        toggleDarkMode() { state.gameState.theme = this.elements.darkModeToggle.checked ? 'dark' : 'light'; this.applyTheme(); persistence.save(); },
        setLanguage(lang) { state.gameState.language = lang; this.updateLangUI(); persistence.save(); },
        updateLangUI() { this.elements.langButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === state.gameState.language)); }
    };

    // --- MÓDULO TIENDA ---
    const shop = {
        elements: {},
        init() {
            this.elements.grid = document.getElementById('shop-items-grid');
            this.render();
            this.elements.grid.addEventListener('click', (event) => {
                if (event.target.classList.contains('buy-btn')) this.buy(event.target.dataset.itemId);
            });
        },
        render() { /* (lógica de renderizado sin cambios) */ },
        buy(avatarId) { /* (lógica de compra sin cambios) */ }
    };

    // --- MÓDULO COLECCIÓN/ARMARIO ---
    const closet = {
        elements: {},
        init() {
            this.elements.grid = document.getElementById('closet-items-grid');
            this.render();
            this.elements.grid.addEventListener('click', (event) => {
                if (event.target.classList.contains('equip-btn')) this.setActive(event.target.dataset.itemId);
            });
        },
        render() { /* (lógica de renderizado sin cambios) */ },
        setActive(avatarId) { /* (lógica de seteo sin cambios) */ }
    };

    // --- MÓDULO RETO MATEMÁTICO ---
    const mathGame = {
        elements: {},
        init() {
            this.elements.levelDisplay = document.getElementById('current-math-level');
            this.elements.problemText = document.getElementById('math-problem-text');
            this.elements.answerInput = document.getElementById('math-answer-input');
            this.elements.checkBtn = document.getElementById('math-check-btn');
            this.elements.feedbackText = document.getElementById('math-feedback-text');
            this.elements.checkBtn.addEventListener('click', () => this.checkAnswer());
            this.elements.answerInput.addEventListener('keyup', (event) => { if (event.key === 'Enter') this.checkAnswer(); });
        },
        start() {
            const level = state.gameState.settings.math.level;
            this.elements.levelDisplay.textContent = level;
            ui.updateAvatar();
            this.generateProblem();
        },
        generateProblem() { /* (lógica de generación sin cambios) */ },
        checkAnswer() { /* (lógica de comprobación sin cambios) */ }
    };
    
    // --- CONTROLADOR PRINCIPAL DEL JUEGO ---
    const game = {
        init() {
            persistence.load();
            settings.init();
            
            ui.elements.gameCards.forEach(card => {
                if (!card.classList.contains('disabled')) {
                    card.addEventListener('click', () => {
                        const viewId = card.dataset.view;
                        this.startModule(viewId);
                        ui.showView(viewId);
                    });
                }
            });
            ui.elements.allBackButtons.forEach(button => {
                button.addEventListener('click', () => ui.showView(button.dataset.view));
            });

            // Actualizar UI inicial
            ui.updateScore();
            ui.updateAvatar();
        },
        startModule(viewId) {
            // Inicializamos el módulo solo la primera vez que se necesita
            switch(viewId) {
                case 'math-challenge-view': 
                    if (!mathGame.isInitialized) { mathGame.init(); mathGame.isInitialized = true; }
                    mathGame.start(); 
                    break;
                case 'shop-view': 
                    if (!shop.isInitialized) { shop.init(); shop.isInitialized = true; }
                    else { shop.render(); } // Re-renderizar por si han cambiado los puntos
                    break;
                case 'closet-view': 
                    if (!closet.isInitialized) { closet.init(); closet.isInitialized = true; }
                    else { closet.render(); }
                    break;
            }
        },
        updateScore(points) {
            state.gameState.score = Math.max(0, state.gameState.score + points);
            ui.updateScore();
            persistence.save();
        }
    };

    // --- PEGADO DE LÓGICA COMPLETA DE MÓDULOS ---
    shop.render = function() { this.elements.grid.innerHTML = ''; state.shopAvatars.forEach(avatar => { if (avatar.price === 0) return; const owned = state.gameState.avatar.owned.includes(avatar.id); const canAfford = state.gameState.score >= avatar.price; const itemEl = document.createElement('div'); itemEl.className = 'shop-item'; itemEl.innerHTML = `<div class="shop-item-icon"><img src="${avatar.path}" alt="${avatar.name}"></div><div class="shop-item-name">${avatar.name}</div><div class="shop-item-price">${avatar.price} 🪙</div><button class="buy-btn" data-item-id="${avatar.id}" ${owned || !canAfford ? 'disabled' : ''}>${owned ? 'Adquirido' : 'Comprar'}</button>`; this.elements.grid.appendChild(itemEl); }); };
    shop.buy = function(avatarId) { const avatar = state.shopAvatars.find(a => a.id === avatarId); if (!avatar || state.gameState.avatar.owned.includes(avatarId) || state.gameState.score < avatar.price) return; game.updateScore(-avatar.price); state.gameState.avatar.owned.push(avatarId); state.gameState.avatar.active = avatarId; persistence.save(); this.render(); ui.updateAvatar(); };
    closet.render = function() { this.elements.grid.innerHTML = ''; state.gameState.avatar.owned.forEach(avatarId => { const avatar = state.shopAvatars.find(a => a.id === avatarId); const isActive = state.gameState.avatar.active === avatarId; const itemEl = document.createElement('div'); itemEl.className = `shop-item ${isActive ? 'active' : ''}`; itemEl.innerHTML = `<div class="shop-item-icon"><img src="${avatar.path}" alt="${avatar.name}"></div><div class="shop-item-name">${avatar.name}</div><button class="equip-btn" data-item-id="${avatar.id}" ${isActive ? 'disabled' : ''}>${isActive ? 'Seleccionado' : 'Seleccionar'}</button>`; this.elements.grid.appendChild(itemEl); }); };
    closet.setActive = function(avatarId) { state.gameState.avatar.active = avatarId; persistence.save(); this.render(); ui.updateAvatar(); };
    mathGame.generateProblem = function() { const level = state.gameState.settings.math.level; this.elements.answerInput.value = ''; this.elements.feedbackText.textContent = ''; this.elements.answerInput.focus(); const ops = ['+', '-']; let maxNum = 10; if (level === 'medium') { ops.push('*'); maxNum = 50; } else if (level === 'hard') { ops.push('*', '/'); maxNum = 100; } const op = ops[Math.floor(Math.random() * ops.length)]; let num1 = Math.floor(Math.random() * maxNum) + 1; let num2 = Math.floor(Math.random() * maxNum) + 1; if (op === '-') { if (num1 < num2) [num1, num2] = [num2, num1]; state.currentMathAnswer = num1 - num2; } else if (op === '+') { state.currentMathAnswer = num1 + num2; } else if (op === '*') { if (level === 'medium') num2 = Math.floor(Math.random() * 9) + 1; state.currentMathAnswer = num1 * num2; } else if (op === '/') { num2 = Math.floor(Math.random() * 9) + 2; num1 = num2 * (Math.floor(Math.random() * (maxNum / num2)) + 1); state.currentMathAnswer = num1 / num2; } this.elements.problemText.textContent = `${num1} ${op} ${num2} = ?`; };
    mathGame.checkAnswer = function() { const userAnswer = parseInt(this.elements.answerInput.value); if (isNaN(userAnswer)) { this.elements.feedbackText.textContent = '¡Introduce un número!'; this.elements.feedbackText.className = 'feedback-text incorrect'; return; } if (userAnswer === state.currentMathAnswer) { this.elements.feedbackText.textContent = '¡Correcto!'; this.elements.feedbackText.className = 'feedback-text correct'; game.updateScore(10); } else { this.elements.feedbackText.textContent = `¡Casi! La respuesta era ${state.currentMathAnswer}`; this.elements.feedbackText.className = 'feedback-text incorrect'; game.updateScore(-5); } setTimeout(() => this.generateProblem(), 1500); };

    game.init();
});
