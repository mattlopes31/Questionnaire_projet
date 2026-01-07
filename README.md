# 🎮 Trivia Game - Jeu de Questions-Réponses en Temps Réel

> Projet Atelier Services Web - EPSI Bachelor 3

## 📋 Description

Application web de jeu de questions-réponses (trivia) multijoueur en temps réel. Les joueurs peuvent créer ou rejoindre des sessions de jeu via un code unique, répondre à des questions avec un chronomètre, et voir le classement se mettre à jour en direct.



## 🚀 Fonctionnalités

### Serveur
- ✅ Serveur NodeJS avec WebSockets (Socket.io)
- ✅ Base de données MySQL pour les questions/réponses
- ✅ Création de sessions de jeu avec code unique
- ✅ Génération aléatoire de questions par session
- ✅ Gestion de la boucle de jeu
- ✅ Calcul des scores en fonction de la rapidité
- ✅ Classement en temps réel

### Client
- ✅ Interface de création de partie (choix du nombre de questions)
- ✅ Interface pour rejoindre une partie (code + pseudo)
- ✅ Affichage des joueurs connectés dans le lobby
- ✅ Lancement de la partie par le créateur
- ✅ Affichage des questions avec 4 propositions
- ✅ Chronomètre de 10 secondes par question
- ✅ Classement mis à jour en temps réel
- ✅ Page de fin de partie avec classement final

## 🛠️ Technologies Utilisées

- **Backend:** Node.js + Express
- **WebSockets:** Socket.io
- **Base de données:** MySQL
- **Frontend:** HTML, CSS, JavaScript (Vanilla)

## 📦 Installation

### Prérequis
- Node.js (v18 ou supérieur)
- npm
- MySQL Server

### Étapes d'installation

1. **Cloner le repository**
   ```bash
   git clone https://github.com/[VOTRE_USERNAME]/trivia-game.git
   cd trivia-game
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer MySQL**
   
   Modifier les identifiants dans `server/database.js` et `database/init.js` :
   ```javascript
   const dbConfig = {
       host: 'localhost',
       user: 'root',           // Votre utilisateur MySQL
       password: '',           // Votre mot de passe MySQL
       database: 'trivia_game'
   };
   ```

4. **Initialiser la base de données**
   ```bash
   npm run init-db
   ```

5. **Lancer le serveur**
   ```bash
   npm start
   ```

6. **Accéder à l'application**
   
   Ouvrir votre navigateur à l'adresse : `http://localhost:3000`

## 📁 Structure du Projet

```
trivia-game/
├── server/
│   ├── index.js          # Point d'entrée du serveur
│   ├── socket.js         # Gestion des WebSockets
│   ├── database.js       # Configuration MySQL
│   └── game.js           # Logique de jeu
├── public/
│   ├── index.html        # Page principale
│   ├── css/
│   │   └── style.css     # Styles
│   └── js/
│       └── main.js       # Script client
├── database/
│   └── init.js           # Script d'initialisation BDD
├── package.json
└── README.md
```

## 🎯 Règles du Jeu

### Déroulement d'une partie

1. Un joueur crée une partie et reçoit un **code de session**
2. Les autres joueurs rejoignent avec ce code et un pseudo
3. Le créateur lance la partie quand tous les joueurs sont prêts
4. Pour chaque question :
   - Les joueurs voient la question et 4 propositions
   - Un chronomètre de **10 secondes** démarre
   - Les joueurs sélectionnent leur réponse
   - Quand tout le monde a répondu (ou temps écoulé), la bonne réponse s'affiche
5. À la fin, le classement final est affiché

### Système de Points

| Condition | Points |
|-----------|--------|
| Bonne réponse en moins de 5 secondes | **10 points** |
| Bonne réponse entre 5 et 10 secondes | **5 points** |
| Bonne réponse après 10 secondes | **2 points** |
| Mauvaise réponse | **0 point** |

## 🗄️ Structure de la Base de Données

### Table `questions`

```sql
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question TEXT NOT NULL,
    reponse1 VARCHAR(255) NOT NULL,
    reponse2 VARCHAR(255) NOT NULL,
    reponse3 VARCHAR(255) NOT NULL,
    reponse4 VARCHAR(255) NOT NULL,
    bonne_reponse INT NOT NULL CHECK (bonne_reponse BETWEEN 1 AND 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| Champ | Type | Description |
|-------|------|-------------|
| id | INT | Identifiant unique (PRIMARY KEY, AUTO_INCREMENT) |
| question | TEXT | Texte de la question |
| reponse1 | VARCHAR(255) | Première proposition |
| reponse2 | VARCHAR(255) | Deuxième proposition |
| reponse3 | VARCHAR(255) | Troisième proposition |
| reponse4 | VARCHAR(255) | Quatrième proposition |
| bonne_reponse | INT | Numéro de la bonne réponse (1-4) |
| created_at | TIMESTAMP | Date de création |

## 🔌 API WebSocket - Événements

### Client → Serveur

| Événement | Données | Description |
|-----------|---------|-------------|
| `create-game` | `{ nbQuestions }` | Créer une nouvelle partie |
| `join-game` | `{ code, pseudo }` | Rejoindre une partie existante |
| `start-game` | `{ code }` | Lancer la partie (créateur uniquement) |
| `submit-answer` | `{ code, answer }` | Soumettre une réponse |

### Serveur → Client

| Événement | Données | Description |
|-----------|---------|-------------|
| `game-created` | `{ code }` | Confirmation de création |
| `join-success` | `{ code, players }` | Connexion réussie |
| `join-error` | `{ message }` | Erreur de connexion |
| `player-joined` | `{ players }` | Un joueur a rejoint |
| `player-left` | `{ players }` | Un joueur est parti |
| `game-started` | `{}` | La partie commence |
| `new-question` | `{ index, total, question, answers, timer }` | Nouvelle question |
| `player-answered` | `{ answersCount, totalPlayers }` | Mise à jour des réponses |
| `question-result` | `{ correctAnswer, correctAnswerText, results }` | Résultat de la question |
| `game-ended` | `{ ranking }` | Fin de la partie |

## 📝 Scripts Disponibles

```bash
# Démarrer le serveur
npm start

# Démarrer en mode développement (avec rechargement automatique)
npm run dev

# Initialiser/réinitialiser la base de données
npm run init-db
```

## 🎨 Bonus (Non notés)

- [ ] Customisation de la partie (durée du chrono)
- [ ] Mode thématique (catégories de questions)
- [ ] Mode animateur (créateur ne peut pas jouer)
- [ ] Sauvegarde des scores historiques

## 📄 Licence

Ce projet est réalisé dans le cadre d'un projet pédagogique à l'EPSI.

---

**Professeur:** Romain GONÇALVES  
**GitHub:** [@3rgo](https://github.com/3rgo)
