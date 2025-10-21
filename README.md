# Slither.io Clone

Un clone du jeu Slither.io créé en HTML5, CSS3 et JavaScript vanilla.

## Fonctionnalités

- Serpent joueur contrôlé par la souris
- 8 bots qui se déplacent aléatoirement
- Système de nourriture pour grandir
- Détection de collisions
- Score en temps réel
- Interface responsive

## Comment jouer

1. Ouvrez le fichier `index.html` dans votre navigateur web
2. Déplacez votre souris pour contrôler votre serpent
3. Mangez la nourriture colorée pour grandir
4. Évitez de percuter les autres serpents et vous-même
5. Essayez d'obtenir le meilleur score possible!

## Règles

- Mangez de la nourriture pour augmenter votre longueur (+1 point par nourriture)
- Si vous percutez un autre serpent, vous perdez
- Si un bot percute votre serpent, il meurt et vous gagnez +5 points
- Les bots se régénèrent automatiquement
- Le terrain est infini (wrap around sur les bords)

## Technologies utilisées

- HTML5 Canvas
- CSS3
- JavaScript ES6+

## Configuration

Vous pouvez modifier les paramètres du jeu dans le fichier `game.js` :

```javascript
const CONFIG = {
    CANVAS_WIDTH: 1200,        // Largeur du canvas
    CANVAS_HEIGHT: 800,        // Hauteur du canvas
    SNAKE_SPEED: 3,            // Vitesse du joueur
    BOT_SPEED: 2,              // Vitesse des bots
    SNAKE_RADIUS: 8,           // Taille des serpents
    INITIAL_LENGTH: 10,        // Longueur initiale
    FOOD_COUNT: 150,           // Nombre de nourriture
    FOOD_RADIUS: 3,            // Taille de la nourriture
    BOT_COUNT: 8,              // Nombre de bots
    DIRECTION_CHANGE_INTERVAL: 2000  // Fréquence de changement de direction (ms)
};
```

Amusez-vous bien!
