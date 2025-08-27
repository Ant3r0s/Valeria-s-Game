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

    // --- MÓDULO DE UI (MANEJO DEL DOM) ---
    const ui = {
        scoreValueEl: document.getElementById('score-value'),
        views: document.querySelectorAll('.view'),
        gameCards: document.querySelectorAll('#main-menu-view .game-card'),
        backButtons: document.querySelectorAll('.back-button'),
        headerAvatarImg: document.getElementById('header-avatar-img'),
        mathAvatarImg: document.getElementById('math-avatar-img'),
        // ... (el resto de elementos se cogerán dentro de sus módulos)
        
        showView(viewId) {
            this.views.forEach(view => {
                if (!view.classList.contains('modal')) view.classList.add('hidden');
            });
            document.getElementById(viewId).classList.remove('hidden');
        },

        updateScore() {
            this.scoreValueEl.textContent = state.gameState.score;
        },
        
        updateAvatar() {
            const activeAvatar = state.shopAvatars.find(a => a.id === state.gameState.avatar.active);
            if (activeAvatar) {
                this.headerAvatarImg.src = activeAvatar.path;
                this.mathAvatarImg.src = activeAvatar.path;
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
                // Merge inteligente para no perder nuevas propiedades en futuras actualizaciones
                Object.assign(state.gameState, loadedState);
            }
        }
    };
    
    // --- MÓDULO DE AJUSTES ---
    const settings = {
        elements: {
            settingsBtn: document.getElementById('settings-btn'),
            settingsView: document.getElementById('settings-view'),
            closeSettingsBtn: document.querySelector('#settings-view .close-button'),
            mathLevelSettingBtns: document.querySelectorAll('#math-level-setting .difficulty-btn'),
            darkModeToggle: document.getElementById('dark-mode-toggle'),
            langButtons: document.querySelectorAll('.lang-btn')
        },
        init() {
            this.elements.settingsBtn.addEventListener('click', () => this.open());
            this.elements.closeSettingsBtn.addEventListener('click', () => this.close());
            this.elements.mathLevelSettingBtns.forEach(btn => {
                btn.addEventListener('click', () => this.setMathLevel(btn.dataset.level));
            });
            this.elements.darkModeToggle.addEventListener('change', () => this.toggleDarkMode());
            this.elements.langButtons.forEach(btn => {
                btn.addEventListener('click', () => this.setLanguage(btn.dataset.lang));
            });
        },
        open() {
            this.updateUI();
            this.elements.settingsView.classList.remove('hidden');
        },
        close() {
            this.elements.settingsView.classList.add('hidden');
        },
        updateUI() {
            const { math } = state.gameState.settings;
            this.elements.mathLevelSettingBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.level === math.level);
            });
            this.elements.darkModeToggle.checked = state.gameState.theme === 'dark';
        },
        applyTheme() {
            document.body.classList.toggle('dark-mode', state.gameState.theme === 'dark');
        },
        setMathLevel(level) {
            state.gameState.settings.math.level = level;
            persistence.save();
            this.updateUI();
        },
        toggleDarkMode() {
            state.gameState.theme = this.elements.darkModeToggle.checked ? 'dark' : 'light';
            this.applyTheme();
            persistence.save();
        },
        setLanguage(lang) {
            state.gameState.language = lang;
            this.elements.langButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));
            persistence.save();
            // Lógica para cambiar textos de la UI (i18n) iría aquí
        }
    };

    // --- MÓDULO TIENDA ---
    const shop = {
        elements: { grid: document.getElementById('shop-items-grid') },
        init() {
            this.render();
            // Usamos delegación de eventos en el grid
            this.elements.grid.addEventListener('click', (event) => {
                if (event.target.classList.contains('buy-btn')) {
                    this.buy(event.target.dataset.itemId);
                }
            });
        },
        render() {
            this.elements.grid.innerHTML = '';
            state.shopAvatars.forEach(avatar => {
                if (avatar.price === 0) return;
                const owned = state.gameState.avatar.owned.includes(avatar.id);
                const canAfford = state.gameState.score >= avatar.price;
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
                this.elements.grid.appendChild(itemEl);
            });
        },
        buy(avatarId) {
            const avatar = state.shopAvatars.find(a => a.id === avatarId);
            if (!avatar || state.gameState.avatar.owned.includes(avatarId) || state.gameState.score < avatar.price) return;
            
            game.updateScore(-avatar.price);
            state.gameState.avatar.owned.push(avatarId);
            state.gameState.avatar.active = avatarId;
            
            persistence.save();
            this.render();
            ui.updateAvatar();
        }
    };

    // --- MÓDULO COLECCIÓN/ARMARIO ---
    const closet = {
        elements: { grid: document.getElementById('closet-items-grid') },
        init() {
            this.render();
            this.elements.grid.addEventListener('click', (event) => {
                if (event.target.classList.contains('equip-btn')) {
                    this.setActive(event.target.dataset.itemId);
                }
            });
        },
        render() {
            this.elements.grid.innerHTML = '';
            state.gameState.avatar.owned.forEach(avatarId => {
                const avatar = state.shopAvatars.find(a => a.id === avatarId);
                const isActive = state.gameState.avatar.active === avatarId;
                const itemEl = document.createElement('div');
                itemEl.className = `shop-item ${isActive ? 'active' : ''}`;
                itemEl.innerHTML = `
                    <div class="shop-item-icon"><img src="${avatar.path}" alt="${avatar.name}"></div>
                    <div class.shop-item-name">${avatar.name}</div>
                    <button class="equip-btn" data-item-id="${avatar.id}" ${isActive ? 'disabled' : ''}>
                        ${isActive ? 'Seleccionado' : 'Seleccionar'}
                    </button>
                `;
                this.elements.grid.appendChild(itemEl);
            });
        },
        setActive(avatarId) {
            state.gameState.avatar.active = avatarId;
            persistence.save();
            this.render();
            ui.updateAvatar();
        }
    };

    // --- MÓDULO RETO MATEMÁTICO ---
    const mathGame = {
        elements: {
            levelDisplay: document.getElementById('current-math-level'),
            problemText: document.getElementById('math-problem-text'),
            answerInput: document.getElementById('math-answer-input'),
            checkBtn: document.getElementById('math-check-btn'),
            feedbackText: document.getElementById('math-feedback-text')
        },
        init() {
            this.elements.checkBtn.addEventListener('click', () => this.checkAnswer());
            this.elements.answerInput.addEventListener('keyup', (event) => {
                if (event.key === 'Enter') this.checkAnswer();
            });
        },
        start() {
            const level = state.gameState.settings.math.level;
            this.elements.levelDisplay.textContent = level.charAt(0).toUpperCase() + level.slice(1);
            ui.updateAvatar(); // Asegurarse de que el avatar está visible
            this.generateProblem();
        },
        generateProblem() {
            const level = state.gameState.settings.math.level;
            this.elements.answerInput.value = '';
            this.elements.feedbackText.textContent = '';
            this.elements.answerInput.focus();
            const ops = ['+', '-']; let maxNum = 10;
            if (level === 'medium') { ops.push('*'); maxNum = 50; }
            else if (level === 'hard') { ops.push('*', '/'); maxNum = 100; }
            const op = ops[Math.floor(Math.random() * ops.length)];
            let num1 = Math.floor(Math.random() * maxNum) + 1;
            let num2 = Math.floor(Math.random() * maxNum) + 1;
            if (op === '-') { if (num1 < num2) [num1, num2] = [num2, num1]; state.currentMathAnswer = num1 - num2; }
            else if (op === '+') { state.currentMathAnswer = num1 + num2; }
            else if (op === '*') { if (level === 'medium') num2 = Math.floor(Math.random() * 9) + 1; state.currentMathAnswer = num1 * num2; }
            else if (op === '/') { num2 = Math.floor(Math.random() * 9) + 2; num1 = num2 * (Math.floor(Math.random() * (maxNum / num2)) + 1); state.currentMathAnswer = num1 / num2; }
            this.elements.problemText.textContent = `${num1} ${op} ${num2} = ?`;
        },
        checkAnswer() {
            const userAnswer = parseInt(this.elements.answerInput.value);
            if (isNaN(userAnswer)) { this.elements.feedbackText.textContent = '¡Introduce un número!'; this.elements.feedbackText.className = 'feedback-text incorrect'; return; }
            if (userAnswer === state.currentMathAnswer) {
                this.elements.feedbackText.textContent = '¡Correcto!';
                this.elements.feedbackText.className = 'feedback-text correct';
                game.updateScore(10);
            } else {
                this.elements.feedbackText.textContent = `¡Casi! La respuesta era ${state.currentMathAnswer}`;
                this.elements.feedbackText.className = 'feedback-text incorrect';
                game.updateScore(-5);
            }
            setTimeout(() => this.generateProblem(), 1500);
        }
    };
    
    // --- CONTROLADOR PRINCIPAL DEL JUEGO ---
    const game = {
        init() {
            persistence.load();
            settings.init();
            mathGame.init();

            ui.gameCards.forEach(card => {
                if (!card.classList.contains('disabled')) {
                    card.addEventListener('click', () => {
                        const viewId = card.dataset.view;
                        this.startModule(viewId);
                        ui.showView(viewId);
                    });
                }
            });

            ui.backButtons.forEach(button => {
                button.addEventListener('click', () => ui.showView(button.dataset.view));
            });

            // Actualizar UI inicial
            ui.updateScore();
            ui.updateAvatar();
            settings.applyTheme();
            ui.showView('main-menu-view');
        },
        startModule(viewId) {
            switch(viewId) {
                case 'math-challenge-view': mathGame.start(); break;
                case 'shop-view': shop.init(); break;
                case 'closet-view': closet.init(); break;
            }
        },
        updateScore(points) {
            state.gameState.score = Math.max(0, state.gameState.score + points);
            ui.updateScore();
            persistence.save();
        }
    };

    game.init();
});
