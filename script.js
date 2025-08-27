document.addEventListener('DOMContentLoaded', () => {
    // --- ESTADO GLOBAL Y DATOS ---
    const gameState = {
        score: 0,
        language: 'es',
        theme: 'light', // 'light' o 'dark'
        settings: {
            math: { level: 'easy' },
        },
        avatar: { items: [] },
    };

    // Base de datos de la tienda - ¡Nuevos Items!
    const shopItems = [
        { id: 'hat_1', name: 'Gorra', price: 50, icon: '🧢', type: 'hat' },
        { id: 'glasses_1', name: 'Gafas de Sol', price: 75, icon: '😎', type: 'glasses' },
        { id: 'mustache_1', name: 'Bigote', price: 100, icon: '〰️', type: 'feature' }, // Usamos un icono más adecuado
        { id: 'crown_1', name: 'Corona', price: 500, icon: '👑', type: 'hat' },
        { id: 'shirt_1', name: 'Camiseta', price: 120, icon: '👕', type: 'shirt' },
        { id: 'shoes_1', name: 'Zapatillas', price: 90, icon: '👟', type: 'shoes' },
    ];

    // --- REFERENCIAS A ELEMENTOS DEL DOM ---
    const scoreValueEl = document.getElementById('score-value');
    const views = document.querySelectorAll('.view');
    const langButtons = document.querySelectorAll('.lang-btn');
    const gameCards = document.querySelectorAll('#main-menu-view .game-card');
    const backButtons = document.querySelectorAll('.back-button');
    const avatarPreviewHeader = document.getElementById('avatar-preview-header');
    const avatarPreviewMath = document.getElementById('avatar-preview-math'); // Nuevo: avatar en el juego de mates
    
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

    // --- GESTIÓN DE VISTAS Y NAVEGACIÓN ---
    function showView(viewId) {
        views.forEach(view => {
            if (!view.classList.contains('modal')) {
                view.classList.add('hidden');
            }
        });
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.remove('hidden');
        } else {
            console.error(`Vista no encontrada: ${viewId}`);
        }
    }

    gameCards.forEach(card => {
        if (!card.classList.contains('disabled')) {
            card.addEventListener('click', () => {
                const gameId = card.dataset.game;
                if (gameId === 'math-challenge') startGameMath();
                if (gameId === 'shop') renderShop();
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
        // Actualizar interruptor de modo oscuro
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

    function applyTheme() {
        document.body.classList.toggle('dark-mode', gameState.theme === 'dark');
    }

    // --- LÓGICA DE LA TIENDA Y AVATAR ---
    function renderShop() {
        shopItemsGrid.innerHTML = '';
        shopItems.forEach(item => {
            const owned = gameState.avatar.items.includes(item.id);
            const canAfford = gameState.score >= item.price;
            const itemEl = document.createElement('div');
            itemEl.className = 'shop-item';
            itemEl.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-price">${item.price} 🪙</div>
                <button class="buy-btn" data-item-id="${item.id}" ${owned || !canAfford ? 'disabled' : ''}>
                    ${owned ? 'Comprado' : 'Comprar'}
                </button>
            `;
            shopItemsGrid.appendChild(itemEl);
        });
    }
    shopItemsGrid.addEventListener('click', (event) => {
        if (event.target.classList.contains('buy-btn')) {
            const itemId = event.target.dataset.itemId;
            buyItem(itemId);
        }
    });
    function buyItem(itemId) {
        const item = shopItems.find(i => i.id === itemId);
        if (!item || gameState.avatar.items.includes(itemId) || gameState.score < item.price) return;
        updateScore(-item.price);
        gameState.avatar.items.push(itemId);
        saveState();
        renderShop();
        renderAvatar(); // Actualizar avatar en el header
        renderAvatarInGame(); // Actualizar avatar en el juego de mates (si está visible)
    }

    // Renderiza el avatar en la cabecera (pequeño)
    function renderAvatar() {
        avatarPreviewHeader.querySelectorAll('.avatar-item-preview').forEach(el => el.remove());
        gameState.avatar.items.forEach(itemId => {
            const item = shopItems.find(i => i.id === itemId);
            if (item) {
                const itemEl = document.createElement('div');
                itemEl.className = `avatar-item-preview item-${item.type}`;
                itemEl.textContent = item.icon; // Usamos el icono directamente
                avatarPreviewHeader.appendChild(itemEl);
            }
        });
    }

    // Renderiza el avatar en el área de juego (más grande)
    function renderAvatarInGame() {
        // Limpiar items anteriores (excepto la base)
        avatarPreviewMath.querySelectorAll('.avatar-item-preview').forEach(el => el.remove());
        
        gameState.avatar.items.forEach(itemId => {
            const item = shopItems.find(i => i.id === itemId);
            if (item) {
                const itemEl = document.createElement('div');
                itemEl.className = `avatar-item-preview item-${item.type}`; // Clases de tipo para CSS
                itemEl.textContent = item.icon;
                avatarPreviewMath.appendChild(itemEl);
            }
        });
    }


    // --- GUARDADO Y CARGA DE DATOS ---
    function saveState() {
        localStorage.setItem('valeriaGameState', JSON.stringify(gameState));
    }

    function loadState() {
        const savedState = localStorage.getItem('valeriaGameState');
        if (savedState) {
            const loadedState = JSON.parse(savedState);
            gameState.score = loadedState.score || 0;
            gameState.language = loadedState.language || 'es';
            gameState.theme = loadedState.theme || 'light';
            if (loadedState.settings) {
                if (loadedState.settings.math) gameState.settings.math = loadedState.settings.math;
            }
            if (loadedState.avatar) gameState.avatar = loadedState.avatar;
        }
        updateUI();
        applyTheme();
    }
    
    function updateUI() {
        scoreValueEl.textContent = gameState.score;
        langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === gameState.language);
        });
        renderAvatar(); // Siempre renderizar el del header
        // Si estamos en la vista de juego de mates, también renderizar el grande
        if (!document.getElementById('math-challenge-view').classList.contains('hidden')) {
            renderAvatarInGame();
        }
    }

    // --- LÓGICA DEL JUEGO DE MATEMÁTICAS ---
    function startGameMath() {
        const level = gameState.settings.math.level;
        currentMathLevelEl.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        renderAvatarInGame(); // Asegurarnos de que el avatar se renderice al iniciar el juego
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
        if (isNaN(userAnswer)) { // Validar que la respuesta sea un número
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
    
    // --- OTRAS FUNCIONES ---
    langButtons.forEach(button => { button.addEventListener('click', () => { gameState.language = button.dataset.lang; updateUI(); saveState(); }); });
    function updateScore(points) {
        gameState.score = Math.max(0, gameState.score + points);
        scoreValueEl.textContent = gameState.score;
        saveState();
    }
    
    // --- INICIALIZACIÓN ---
    function init() {
        loadState();
        showView('main-menu-view');
    }

    init();
});
