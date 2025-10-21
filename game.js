// Configuration du jeu
const CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,
    SNAKE_SPEED: 3,
    BOT_SPEED: 2,
    SNAKE_RADIUS: 8,
    INITIAL_LENGTH: 10,
    FOOD_COUNT: 150,
    FOOD_RADIUS: 3,
    BOT_COUNT: 8,
    DIRECTION_CHANGE_INTERVAL: 2000 // Changement de direction des bots toutes les 2 secondes
};

// Initialisation du canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.CANVAS_WIDTH;
canvas.height = CONFIG.CANVAS_HEIGHT;

// Variables du jeu
let gameStarted = false;
let score = 0;
let mouseX = CONFIG.CANVAS_WIDTH / 2;
let mouseY = CONFIG.CANVAS_HEIGHT / 2;
let playerSnake;
let botSnakes = [];
let food = [];

// Classe pour représenter un segment de serpent
class SnakeSegment {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

// Classe Snake (pour le joueur et les bots)
class Snake {
    constructor(x, y, isPlayer = false, color = null) {
        this.segments = [];
        this.isPlayer = isPlayer;
        this.alive = true;
        this.speed = isPlayer ? CONFIG.SNAKE_SPEED : CONFIG.BOT_SPEED;
        this.angle = Math.random() * Math.PI * 2;
        this.targetAngle = this.angle;
        this.color = color || this.randomColor();
        this.headColor = this.brightenColor(this.color);

        // Initialiser les segments avec un espacement suffisant
        for (let i = 0; i < CONFIG.INITIAL_LENGTH; i++) {
            this.segments.push(new SnakeSegment(
                x - i * CONFIG.SNAKE_RADIUS * 2,
                y
            ));
        }

        // Pour les bots: intervalle de changement de direction
        if (!isPlayer) {
            this.setRandomTarget();
            this.directionChangeTimer = setInterval(() => {
                this.setRandomTarget();
            }, CONFIG.DIRECTION_CHANGE_INTERVAL + Math.random() * 1000);
        }
    }

    randomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
            '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
            '#F8B739', '#52B788', '#E76F51', '#2A9D8F'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    brightenColor(color) {
        // Rendre la couleur plus claire pour la tête
        return color + '44';
    }

    setRandomTarget() {
        // Les bots choisissent une direction aléatoire
        this.targetAngle = Math.random() * Math.PI * 2;
    }

    update(targetX, targetY) {
        if (!this.alive) return;

        const head = this.segments[0];

        if (this.isPlayer) {
            // Joueur: suivre la souris
            const dx = targetX - head.x;
            const dy = targetY - head.y;
            this.angle = Math.atan2(dy, dx);
        } else {
            // Bot: transition douce vers l'angle cible
            let angleDiff = this.targetAngle - this.angle;

            // Normaliser la différence d'angle
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            // Tourner progressivement
            this.angle += angleDiff * 0.05;

            // Éviter les bords
            const margin = 100;
            if (head.x < margin) this.targetAngle = 0;
            if (head.x > CONFIG.CANVAS_WIDTH - margin) this.targetAngle = Math.PI;
            if (head.y < margin) this.targetAngle = Math.PI / 2;
            if (head.y > CONFIG.CANVAS_HEIGHT - margin) this.targetAngle = -Math.PI / 2;
        }

        // Calculer la nouvelle position de la tête
        const newX = head.x + Math.cos(this.angle) * this.speed;
        const newY = head.y + Math.sin(this.angle) * this.speed;

        // Téléportation sur les bords (wrap around)
        let wrappedX = newX;
        let wrappedY = newY;

        if (newX < 0) wrappedX = CONFIG.CANVAS_WIDTH;
        if (newX > CONFIG.CANVAS_WIDTH) wrappedX = 0;
        if (newY < 0) wrappedY = CONFIG.CANVAS_HEIGHT;
        if (newY > CONFIG.CANVAS_HEIGHT) wrappedY = 0;

        // Ajouter nouveau segment à la tête
        this.segments.unshift(new SnakeSegment(wrappedX, wrappedY));

        // Retirer le dernier segment
        this.segments.pop();
    }

    grow() {
        // Ajouter un segment à la fin
        const tail = this.segments[this.segments.length - 1];
        this.segments.push(new SnakeSegment(tail.x, tail.y));
    }

    draw() {
        if (!this.alive) return;

        // Dessiner le corps
        for (let i = this.segments.length - 1; i >= 0; i--) {
            const segment = this.segments[i];
            const radius = CONFIG.SNAKE_RADIUS - (i === 0 ? 0 : 1);

            ctx.beginPath();
            ctx.arc(segment.x, segment.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = i === 0 ? this.headColor : this.color;
            ctx.fill();

            // Bordure pour un meilleur effet visuel
            if (i === 0) {
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        }

        // Dessiner les yeux si c'est le joueur
        if (this.isPlayer) {
            const head = this.segments[0];
            const eyeDistance = 4;
            const eyeSize = 2;

            const leftEyeX = head.x + Math.cos(this.angle - 0.3) * eyeDistance;
            const leftEyeY = head.y + Math.sin(this.angle - 0.3) * eyeDistance;
            const rightEyeX = head.x + Math.cos(this.angle + 0.3) * eyeDistance;
            const rightEyeY = head.y + Math.sin(this.angle + 0.3) * eyeDistance;

            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
            ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    checkCollisionWithSnake(otherSnake) {
        if (!this.alive || !otherSnake.alive) return false;

        const head = this.segments[0];

        // Vérifier collision avec chaque segment de l'autre serpent
        // Ignorer les 15 premiers segments si c'est soi-même pour éviter les fausses collisions
        const startIndex = otherSnake === this ? 15 : 0;

        for (let i = startIndex; i < otherSnake.segments.length; i++) {
            const segment = otherSnake.segments[i];
            const distance = Math.hypot(head.x - segment.x, head.y - segment.y);

            if (distance < CONFIG.SNAKE_RADIUS * 1.5) {
                return true;
            }
        }

        return false;
    }

    die() {
        this.alive = false;
        if (this.directionChangeTimer) {
            clearInterval(this.directionChangeTimer);
        }

        // Créer de la nourriture à partir des segments
        for (let i = 0; i < this.segments.length; i += 2) {
            const segment = this.segments[i];
            food.push({
                x: segment.x,
                y: segment.y,
                color: this.color
            });
        }
    }

    getLength() {
        return this.segments.length;
    }
}

// Classe pour la nourriture
function createFood() {
    food = [];
    for (let i = 0; i < CONFIG.FOOD_COUNT; i++) {
        food.push({
            x: Math.random() * CONFIG.CANVAS_WIDTH,
            y: Math.random() * CONFIG.CANVAS_HEIGHT,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`
        });
    }
}

function drawFood() {
    food.forEach(f => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, CONFIG.FOOD_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
    });
}

// Vérifier si le serpent mange de la nourriture
function checkFoodCollision(snake) {
    const head = snake.segments[0];

    for (let i = food.length - 1; i >= 0; i--) {
        const f = food[i];
        const distance = Math.hypot(head.x - f.x, head.y - f.y);

        if (distance < CONFIG.SNAKE_RADIUS + CONFIG.FOOD_RADIUS) {
            food.splice(i, 1);
            snake.grow();

            if (snake.isPlayer) {
                score += 1;
                updateScore();
            }

            // Ajouter nouvelle nourriture
            food.push({
                x: Math.random() * CONFIG.CANVAS_WIDTH,
                y: Math.random() * CONFIG.CANVAS_HEIGHT,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`
            });
        }
    }
}

// Initialiser le jeu
function initGame() {
    // Créer le serpent joueur
    playerSnake = new Snake(
        CONFIG.CANVAS_WIDTH / 2,
        CONFIG.CANVAS_HEIGHT / 2,
        true,
        '#00FF88'
    );

    // Créer les bots loin du joueur
    botSnakes = [];
    for (let i = 0; i < CONFIG.BOT_COUNT; i++) {
        let x, y, tooClose;

        // Réessayer jusqu'à trouver une position loin du joueur
        do {
            x = Math.random() * CONFIG.CANVAS_WIDTH;
            y = Math.random() * CONFIG.CANVAS_HEIGHT;

            const distanceToPlayer = Math.hypot(
                x - CONFIG.CANVAS_WIDTH / 2,
                y - CONFIG.CANVAS_HEIGHT / 2
            );

            // Les bots doivent être à au moins 200 pixels du joueur
            tooClose = distanceToPlayer < 200;
        } while (tooClose);

        botSnakes.push(new Snake(x, y, false));
    }

    // Créer la nourriture
    createFood();

    score = 0;
    updateScore();
}

// Mettre à jour le score
function updateScore() {
    document.getElementById('score').textContent = `Score: ${score} | Longueur: ${playerSnake.getLength()}`;
}

// Contrôles de la souris
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    if (!gameStarted) {
        gameStarted = true;
        document.getElementById('instructions').classList.add('hidden');
    }
});

// Boucle de jeu principale
function gameLoop() {
    // Effacer le canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Dessiner la grille
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CONFIG.CANVAS_WIDTH; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, CONFIG.CANVAS_HEIGHT);
        ctx.stroke();
    }
    for (let i = 0; i < CONFIG.CANVAS_HEIGHT; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(CONFIG.CANVAS_WIDTH, i);
        ctx.stroke();
    }

    // Dessiner la nourriture
    drawFood();

    if (gameStarted) {
        // Mettre à jour le joueur
        if (playerSnake.alive) {
            playerSnake.update(mouseX, mouseY);
            checkFoodCollision(playerSnake);

            // Vérifier les collisions avec tous les serpents
            for (let bot of botSnakes) {
                if (playerSnake.checkCollisionWithSnake(bot)) {
                    playerSnake.die();
                    setTimeout(() => {
                        alert(`Game Over! Score final: ${score}`);
                        initGame();
                        gameStarted = false;
                        document.getElementById('instructions').classList.remove('hidden');
                    }, 100);
                    break;
                }
            }

            // Vérifier collision avec soi-même
            if (playerSnake.alive && playerSnake.checkCollisionWithSnake(playerSnake)) {
                playerSnake.die();
                setTimeout(() => {
                    alert(`Game Over! Score final: ${score}`);
                    initGame();
                    gameStarted = false;
                    document.getElementById('instructions').classList.remove('hidden');
                }, 100);
            }
        }

        // Mettre à jour les bots
        for (let i = botSnakes.length - 1; i >= 0; i--) {
            const bot = botSnakes[i];

            if (bot.alive) {
                bot.update(0, 0);
                checkFoodCollision(bot);

                // Vérifier les collisions avec le joueur
                if (playerSnake.alive && bot.checkCollisionWithSnake(playerSnake)) {
                    bot.die();
                    score += 5;
                    updateScore();
                }

                // Vérifier les collisions avec d'autres bots
                for (let j = 0; j < botSnakes.length; j++) {
                    if (i !== j && botSnakes[j].alive) {
                        if (bot.checkCollisionWithSnake(botSnakes[j])) {
                            bot.die();
                            break;
                        }
                    }
                }

                // Vérifier collision avec soi-même
                if (bot.alive && bot.checkCollisionWithSnake(bot)) {
                    bot.die();
                }
            }
        }

        // Remplacer les bots morts
        botSnakes = botSnakes.filter(bot => bot.alive);
        while (botSnakes.length < CONFIG.BOT_COUNT) {
            let x, y, tooClose;

            // Réessayer jusqu'à trouver une position loin du joueur
            do {
                x = Math.random() * CONFIG.CANVAS_WIDTH;
                y = Math.random() * CONFIG.CANVAS_HEIGHT;

                if (playerSnake.alive) {
                    const distanceToPlayer = Math.hypot(
                        x - playerSnake.segments[0].x,
                        y - playerSnake.segments[0].y
                    );

                    // Les bots doivent être à au moins 200 pixels du joueur
                    tooClose = distanceToPlayer < 200;
                } else {
                    tooClose = false;
                }
            } while (tooClose);

            botSnakes.push(new Snake(x, y, false));
        }
    }

    // Dessiner tous les serpents
    botSnakes.forEach(bot => bot.draw());
    if (playerSnake) playerSnake.draw();

    requestAnimationFrame(gameLoop);
}

// Démarrer le jeu
initGame();
gameLoop();
