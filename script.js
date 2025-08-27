document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO GLOBAL Y DATOS ---
    const gameState = {
        score: 0,
        language: 'es',
        theme: 'light',
        settings: { math: { level: 'easy' } },
        avatar: {
            owned: ['stich'],
            active: 'stich',
        }
    };

    const shopAvatars = [
        { id: 'stich', name: 'Experimento', price: 0, path: 'assets/avatar/stich.png' },
        { id: 'shrek', name: 'Ogro del Pantano', price: 150, path: 'assets/avatar/shrek.png' },
        { id: 'balerrinna', name: 'Bailarina', price: 250, path: 'assets/avatar/balerrinna.png' },
        { id: 'maincraft', name: 'Steve', price: 400, path: 'assets/avatar/maincraft.png' },
        { id: 'tung', name: 'Tipo Duro', price: 600, path: 'assets/avatar/tung.png' },
        { id: 'kpop', name: 'Idol K-Pop', price: 1000, path: 'assets/avatar/kpop.png' },
    ];

    // --- REFERENCIAS A ELEMENTOS DEL DOM ---
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
    const mathLevelSettingBtns = document.querySelectorAll('#math-level-setting .difficulty-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const currentMathLevelEl = document.getElementById('current-math-level');
    const mathProblemTextEl = document.getElementById('math-problem-text');
    const mathAnswerInputEl = document.getElementById('math-answer-input');
    const mathCheckBtn = document.getElementById('math-check-btn');
    const mathFeedbackTextEl = document.getElementById('math-feedback-text');
    let currentMathAnswer = 0;
    const shopItemsGrid = document.getElementById('shop-items-grid');
    const closetItemsGrid = document.getElementById('closet-items-grid');

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
                if (gameId === 'shop') renderShop();
                if (gameId === 'closet') renderCloset();
                showView(`${gameId}-view`);
            });
        }
    });

    backButtons.forEach(button => {
        button.addEventListener('click', () => showView('main-menu-view'));
    });

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
        } else {
            // Fallback si el avatar activo no existe (por si acaso)
            const fallbackAvatar = shopAvatars[0];
            headerAvatarImg.src = fallbackAvatar.path;
            mathAvatarImg.src = fallbackAvatar.path;
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
            if (loadedState.settings) gameState.settings = loadedState.settings;
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
    
    // --- LÓGICA DE AJUSTES ---
    settingsBtn.addEventListener('click', () => { updateSettingsUI(); settingsView.classList.remove('hidden'); });
    closeSettingsBtn.addEventListener('click', () => settingsView.classList.add('hidden'));
    function updateSettingsUI() {
        const currentMathLevel = gameState.settings.math.level;
        mathLevelSettingBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.level === currentMathLevel);
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
    darkModeToggle.addEventListener('change', () => {
        gameState.theme = darkModeToggle.checked ? 'dark' : 'light';
        applyTheme();
        saveState();
    });
    function applyTheme() { document.body.classList.toggle('dark-mode', gameState.theme === 'dark'); }

    // --- LÓGICA DEL JUEGO DE MATEMÁTICAS ---
    function startGameMath() {
        const level = gameState.settings.math.level;
        currentMathLevelEl.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        renderAvatar();
        generateMathProblem();
    }
    function generateMathProblem() { const level = gameState.settings.math.level; mathAnswerInputEl.value = ''; mathFeedbackTextEl.textContent = ''; mathAnswerInputEl.focus(); const ops = ['+', '-']; let maxNum = 10; if (level === 'medium') { ops.push('*'); maxNum = 50; } else if (level === 'hard') { ops.push('*', '/'); maxNum = 100; } const op = ops[Math.floor(Math.random() * ops.length)]; let num1 = Math.floor(Math.random() * maxNum) + 1; let num2 = Math.floor(Math.random() * maxNum) + 1; if (op === '-') { if (num1 < num2) [num1, num2] = [num2, num1]; currentMathAnswer = num1 - num2; } else if (op === '+') { currentMathAnswer = num1 + num2; } else if (op === '*') { if (level === 'medium') num2 = Math.floor(Math.random() * 9) + 1; currentMathAnswer = num1 * num2; } else if (op === '/') { num2 = Math.floor(Math.random() * 9) + 2; num1 = num2 * (Math.floor(Math.random() * (maxNum / num2)) + 1); currentMathAnswer = num1 / num2; } mathProblemTextEl.textContent = `${num1} ${op} ${num2} = ?`; }
    function checkMathAnswer() { const userAnswer = parseInt(mathAnswerInputEl.value); if (isNaN(userAnswer)) { mathFeedbackTextEl.textContent = '¡Introduce un número!'; mathFeedbackTextEl.className = 'feedback-text incorrect'; return; } if (userAnswer === currentMathAnswer) { mathFeedbackTextEl.textContent = '¡Correcto!'; mathFeedbackTextEl.className = 'feedback-text correct'; updateScore(10); } else { mathFeedbackTextEl.textContent = `¡Casi! La respuesta era ${currentMathAnswer}`; mathFeedbackTextEl.className = 'feedback-text incorrect'; updateScore(-5); } setTimeout(generateMathProblem, 1500); }
    mathCheckBtn.addEventListener('click', checkMathAnswer);
    mathAnswerInputEl.addEventListener('keyup', (event) => { if (event.key === 'Enter') checkMathAnswer(); });
    
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
