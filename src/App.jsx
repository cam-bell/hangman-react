import React, { useState, useEffect, useRef } from "react";
import "./App.css";

/* =====================
   1) GLOBAL DATA & HELPERS
===================== */

// Predefined words for Spanish and French (API fetch is only used for English)
const spanishWords = [
  "amor",
  "perro",
  "gato",
  "casa",
  "libro",
  "sol",
  "luna",
  "estrella",
  "ciudad",
  "mundo",
];
const frenchWords = [
  "amour",
  "chien",
  "chat",
  "maison",
  "livre",
  "soleil",
  "lune",
  "étoile",
  "ville",
  "monde",
];

// Local definitions for Spanish and French
const spanishDefinitions = {
  amor: "Sentimiento de profundo afecto.",
  perro: "Animal doméstico, conocido como el mejor amigo del hombre.",
  gato: "Animal doméstico, famoso por su independencia y agilidad.",
  casa: "Lugar donde se habita; un hogar.",
  libro: "Conjunto de hojas encuadernadas que contienen texto o imágenes.",
  sol: "La estrella luminosa en el centro del sistema solar.",
  luna: "El satélite natural que orbita la Tierra.",
  estrella: "Cuerpo celeste que brilla en la noche.",
  ciudad: "Área urbana densamente poblada.",
  mundo: "El planeta Tierra o la totalidad de la existencia.",
};
const frenchDefinitions = {
  amour: "Sentiment d'affection profonde.",
  chien:
    "Animal domestique, souvent considéré comme le meilleur ami de l'homme.",
  chat: "Animal domestique apprécié pour son indépendance.",
  maison: "Bâtiment dans lequel on vit, un foyer.",
  livre: "Ensemble de pages imprimées reliées ensemble.",
  soleil: "Étoile au centre de notre système solaire.",
  lune: "Satellite naturel de la Terre.",
  étoile: "Corps céleste qui brille dans le ciel nocturne.",
  ville: "Zone urbaine densément peuplée.",
  monde: "La Terre ou l'ensemble de l'existence.",
};

// Keyboard layouts for different languages
const keyboardLayouts = {
  en: "abcdefghijklmnopqrstuvwxyz",
  es: "abcdefghijklmnñopqrstuvwxyz",
  fr: "abcdefghijklmnopqrstuvwxyzéèêàçù",
};

// UI translations
const translations = {
  en: {
    title: "Hangman Game",
    winsLabel: "Wins: ",
    lossesLabel: "Losses: ",
    languageLabel: "Select language:",
    restartButton: "Restart Game",
    hintButton: "Get Hint",
    leaderboardTitle: "Leaderboard",
    winMessage: "You win!",
    loseMessage: "You lose! The word was: ",
  },
  es: {
    title: "Juego del Ahorcado",
    winsLabel: "Victorias: ",
    lossesLabel: "Derrotas: ",
    languageLabel: "Selecciona idioma:",
    restartButton: "Reiniciar Juego",
    hintButton: "Pedir Pista",
    leaderboardTitle: "Tabla de Resultados",
    winMessage: "¡Ganaste!",
    loseMessage: "¡Perdiste! La palabra era: ",
  },
  fr: {
    title: "Jeu du Pendu",
    winsLabel: "Victoires: ",
    lossesLabel: "Défaites: ",
    languageLabel: "Choisissez la langue:",
    restartButton: "Redémarrer le jeu",
    hintButton: "Obtenir un indice",
    leaderboardTitle: "Classement",
    winMessage: "Vous avez gagné!",
    loseMessage: "Vous avez perdu! Le mot était: ",
  },
};

// Animated drawing helpers using requestAnimationFrame
function animateArc(ctx, x, y, radius, startAngle, endAngle, duration) {
  let startTime = null;
  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentAngle = startAngle + (endAngle - startAngle) * progress;
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, currentAngle);
    ctx.stroke();
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  requestAnimationFrame(animate);
}

function animateLine(ctx, x1, y1, x2, y2, duration) {
  let startTime = null;
  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentX = x1 + (x2 - x1) * progress;
    const currentY = y1 + (y2 - y1) * progress;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  requestAnimationFrame(animate);
}

export default function App() {
  /* =====================
     2) REACT STATES
  ====================== */
  const [language, setLanguage] = useState("en");
  const [difficulty, setDifficulty] = useState("medium");
  const [theme, setTheme] = useState("light");
  const [maxWrongGuesses, setMaxWrongGuesses] = useState(6);

  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);

  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);

  const [selectedWord, setSelectedWord] = useState("");
  const [displayedWord, setDisplayedWord] = useState([]);

  // **New**: store each letter's status in a guessedLetters object
  // letter -> 'correct', 'wrong', or undefined
  const [guessedLetters, setGuessedLetters] = useState({});

  // Leaderboard: array of game results
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [definition, setDefinition] = useState("");

  // Canvas reference
  const canvasRef = useRef(null);

  /* =====================
     3) LOAD STORED SCORES & LEADERBOARD
  ====================== */
  useEffect(() => {
    // Load from localStorage
    const storedWins = localStorage.getItem("hangmanWins");
    const storedLosses = localStorage.getItem("hangmanLosses");
    const storedLeaderboard = localStorage.getItem("hangmanLeaderboard");

    if (storedWins) setWins(parseInt(storedWins));
    if (storedLosses) setLosses(parseInt(storedLosses));
    if (storedLeaderboard) setLeaderboard(JSON.parse(storedLeaderboard));
  }, []);

  /* =====================
     4) HANDLE THEME
  ====================== */
  useEffect(() => {
    // Add or remove "dark" class from body
    if (theme === "dark") {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, [theme]);

  /*****************************************************
   * 1) CREATE AUDIO REFS (OR OBJECTS) FOR BACKGROUND & VICTORY
   *****************************************************/
  const backgroundMusicRef = useRef(new Audio("/background.mp3"));
  const victorySoundRef = useRef(new Audio("/victory.mp3"));
  const loseSoundRef = useRef(new Audio("/lose.mp3"));

  // Manage background music playing or not
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  useEffect(() => {
    // Set up looping & volumes
    backgroundMusicRef.current.loop = true;
    backgroundMusicRef.current.volume = 0.4;
    victorySoundRef.current.volume = 1.0;
    loseSoundRef.current.volume = 1.0;
  }, []);

  // Start or stop background music
  useEffect(() => {
    if (isMusicPlaying) {
      backgroundMusicRef.current
        .play()
        .catch((err) => console.warn("Music play prevented:", err));
    } else {
      backgroundMusicRef.current.pause();
      backgroundMusicRef.current.currentTime = 0;
    }
  }, [isMusicPlaying]);

  /* =====================
     5) FETCH WORD
  ====================== */
  async function fetchWord() {
    if (language === "en") {
      try {
        const response = await fetch(
          "https://random-word-api.herokuapp.com/word?number=1"
        );
        const data = await response.json();
        return data[0].toLowerCase();
      } catch (error) {
        console.error("Error fetching word:", error);
        return "error";
      }
    } else if (language === "es") {
      const randomIndex = Math.floor(Math.random() * spanishWords.length);
      return spanishWords[randomIndex];
    } else if (language === "fr") {
      const randomIndex = Math.floor(Math.random() * frenchWords.length);
      return frenchWords[randomIndex];
    }
  }

  /* =====================
     6) INIT/RESTART GAME
  ====================== */
  async function initGame() {
    // Set max guesses based on difficulty
    if (difficulty === "easy") setMaxWrongGuesses(8);
    else if (difficulty === "medium") setMaxWrongGuesses(6);
    else if (difficulty === "hard") setMaxWrongGuesses(4);

    setWrongGuesses(0);
    setHintUsed(false);
    setMessage("");
    setDefinition("");

    // **New**: Clear guessed letters
    setGuessedLetters({});

    // Clear canvas & draw gallows
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawGallows(ctx);
    }

    // Fetch new word
    const word = await fetchWord();
    setSelectedWord(word);
    setDisplayedWord(Array(word.length).fill("_"));
  }

  /* =====================
     7) DRAW GALLOWS & HANGMAN
  ====================== */
  function drawGallows(ctx) {
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;

    // Base
    ctx.beginPath();
    ctx.moveTo(10, ctx.canvas.height - 10);
    ctx.lineTo(190, ctx.canvas.height - 10);
    ctx.stroke();

    // Vertical post
    ctx.beginPath();
    ctx.moveTo(50, ctx.canvas.height - 10);
    ctx.lineTo(50, 10);
    ctx.stroke();

    // Horizontal beam
    ctx.beginPath();
    ctx.moveTo(50, 10);
    ctx.lineTo(150, 10);
    ctx.stroke();

    // Rope
    ctx.beginPath();
    ctx.moveTo(150, 10);
    ctx.lineTo(150, 40);
    ctx.stroke();
  }

  function getDrawingSteps(ctx) {
    if (difficulty === "easy") {
      return [
        () => {
          animateArc(ctx, 150, 60, 20, 0, Math.PI * 2, 500);
        },
        () => {
          animateLine(ctx, 150, 80, 150, 140, 500);
        },
        () => {
          animateLine(ctx, 150, 100, 130, 120, 500);
        },
        () => {
          animateLine(ctx, 150, 100, 170, 120, 500);
        },
        () => {
          animateLine(ctx, 150, 140, 130, 180, 500);
        },
        () => {
          animateLine(ctx, 150, 140, 170, 180, 500);
        },
        () => {
          animateLine(ctx, 130, 120, 120, 130, 500);
        },
        () => {
          animateLine(ctx, 170, 120, 180, 130, 500);
        },
      ];
    } else if (difficulty === "medium") {
      return [
        () => {
          animateArc(ctx, 150, 60, 20, 0, Math.PI * 2, 500);
        },
        () => {
          animateLine(ctx, 150, 80, 150, 140, 500);
        },
        () => {
          animateLine(ctx, 150, 100, 130, 120, 500);
        },
        () => {
          animateLine(ctx, 150, 100, 170, 120, 500);
        },
        () => {
          animateLine(ctx, 150, 140, 130, 180, 500);
        },
        () => {
          animateLine(ctx, 150, 140, 170, 180, 500);
        },
      ];
    } else if (difficulty === "hard") {
      return [
        () => {
          animateArc(ctx, 150, 60, 20, 0, Math.PI * 2, 500);
        },
        () => {
          animateLine(ctx, 150, 80, 150, 140, 500);
        },
        () => {
          animateLine(ctx, 150, 100, 130, 120, 500);
        },
        () => {
          animateLine(ctx, 150, 100, 170, 120, 500);
        },
      ];
    }
  }

  function drawHangman(step) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const steps = getDrawingSteps(ctx);
    if (step <= steps.length) {
      steps[step - 1]();
    }
  }

  /* =====================
     8) GUESS LOGIC
  ====================== */
  function handleGuess(letter) {
    // If game ended, ignore
    if (message) return;

    // If already guessed, ignore
    if (guessedLetters[letter]) return;

    let newDisplayedWord = [...displayedWord];
    // Determine correct or wrong
    if (selectedWord.includes(letter)) {
      // Mark correct in guessedLetters
      setGuessedLetters((prev) => ({ ...prev, [letter]: "correct" }));
      // Reveal the letters
      for (let i = 0; i < selectedWord.length; i++) {
        if (selectedWord[i] === letter) {
          newDisplayedWord[i] = letter;
        }
      }
      setDisplayedWord(newDisplayedWord);
      // Check for win
      if (!newDisplayedWord.includes("_")) {
        endGame(true);
      }
    } else {
      // Mark wrong in guessedLetters
      setGuessedLetters((prev) => ({ ...prev, [letter]: "wrong" }));
      const newCount = wrongGuesses + 1;
      setWrongGuesses(newCount);
      drawHangman(newCount);
      if (newCount >= maxWrongGuesses) {
        endGame(false);
      }
    }
  }

  function endGame(win) {
    // If win
    if (win) {
      setWins((prev) => {
        const updated = prev + 1;
        localStorage.setItem("hangmanWins", updated);
        return updated;
      });
      setMessage(translations[language].winMessage);
      // Victory sound
      victorySoundRef.current.currentTime = 0;
      victorySoundRef.current.play().catch((err) => {
        console.warn("Could not play victory sound:", err);
      });
    } else {
      // If lose
      setLosses((prev) => {
        const updated = prev + 1;
        localStorage.setItem("hangmanLosses", updated);
        return updated;
      });
      setMessage(translations[language].loseMessage + selectedWord);
      setDisplayedWord(selectedWord.split(""));
      // Lose sound
      loseSoundRef.current.currentTime = 0;
      loseSoundRef.current.play().catch((err) => {
        console.warn("Could not play lose sound:", err);
      });
    }
    // Store result in leaderboard & fetch definition
    storeGameResult(win);
    fetchDefinitionAndDisplay();
  }

  /* =====================
     9) LEADERBOARD
  ====================== */
  function storeGameResult(win) {
    const gameResult = {
      date: new Date().toLocaleString(),
      result: win ? "Win" : "Loss",
      word: selectedWord,
      difficulty,
      language,
    };
    const updatedLeaderboard = [...leaderboard, gameResult];
    setLeaderboard(updatedLeaderboard);
    localStorage.setItem(
      "hangmanLeaderboard",
      JSON.stringify(updatedLeaderboard)
    );
  }

  function showLeaderboard() {
    setIsLeaderboardOpen(true);
  }
  function closeLeaderboard() {
    setIsLeaderboardOpen(false);
  }

  /* =====================
     10) DEFINITIONS & HINTS
  ====================== */
  async function fetchDefinitionAndDisplay() {
    let def = "";
    if (language === "en") {
      try {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${selectedWord}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Definition not found.");
        const data = await response.json();
        if (data[0] && data[0].meanings && data[0].meanings.length > 0) {
          def = data[0].meanings[0].definitions[0].definition;
        } else {
          def = "Definition not found.";
        }
      } catch (err) {
        def = "Definition not found.";
      }
    } else if (language === "es") {
      def = spanishDefinitions[selectedWord] || "Definición no encontrada.";
    } else if (language === "fr") {
      def = frenchDefinitions[selectedWord] || "Définition non trouvée.";
    }
    setDefinition(`Definition: ${def}`);
  }

  async function handleHint() {
    if (hintUsed || wrongGuesses >= maxWrongGuesses) return;
    setHintUsed(true);
    const newCount = wrongGuesses + 1;
    setWrongGuesses(newCount);
    drawHangman(newCount);

    let def = "";
    if (language === "en") {
      try {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${selectedWord}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Hint not found.");
        const data = await response.json();
        if (data[0] && data[0].meanings && data[0].meanings.length > 0) {
          def = data[0].meanings[0].definitions[0].definition;
        } else {
          def = "No hint available.";
        }
      } catch (err) {
        def = "No hint available.";
      }
    } else if (language === "es") {
      def = spanishDefinitions[selectedWord] || "No hay pista disponible.";
    } else if (language === "fr") {
      def = frenchDefinitions[selectedWord] || "Aucun indice disponible.";
    }
    setDefinition(`Hint: ${def}`);
    if (newCount >= maxWrongGuesses && displayedWord.includes("_")) {
      endGame(false);
    }
  }

  /* =====================
     11) RENDER LETTER BUTTONS
     Now uses guessedLetters state to determine styling & disabled status
  ====================== */
  function renderLetterButtons() {
    const letters = keyboardLayouts[language];
    return letters.split("").map((letter) => {
      const status = guessedLetters[letter]; // 'correct' / 'wrong' / undefined
      // Disabled if already guessed or if game is over (message set)
      const isDisabled = status !== undefined || !!message;
      const classes = ["letter-button"];
      if (status === "correct") classes.push("correct");
      if (status === "wrong") classes.push("wrong");

      return (
        <button
          key={letter}
          id={`letter-btn-${letter}`}
          className={classes.join(" ")}
          disabled={isDisabled}
          onClick={() => handleGuess(letter)}
        >
          {letter}
        </button>
      );
    });
  }

  /* =====================
     12) ON MOUNT
  ====================== */
  useEffect(() => {
    initGame();
    // eslint-disable-next-line
  }, [language, difficulty]); // re-init on language/difficulty change

  /* =====================
     13) RENDER
  ====================== */
  return (
    <div id="game-container">
      {/* Top Controls & Scoreboard */}
      <div className="section-card">
        <div id="scoreboard-row">
          <div style={{ fontSize: "1.3rem", fontWeight: 600 }}>
            {translations[language].title}
          </div>
          <div>
            <span id="wins-label">{translations[language].winsLabel}</span>
            <span id="wins">{wins}</span>
            {" | "}
            <span id="losses-label">{translations[language].lossesLabel}</span>
            <span id="losses">{losses}</span>
          </div>
        </div>
        <div className="controls-row">
          <div className="control-group">
            <label htmlFor="language">
              <i className="fa fa-globe"></i>{" "}
              {translations[language].languageLabel}
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>
          <div className="control-group">
            <label htmlFor="difficulty">
              <i className="fa fa-tachometer-alt"></i> Difficulty:
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="control-group">
            <label htmlFor="theme">
              <i className="fa fa-adjust"></i> Theme:
            </label>
            <select
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>

      {/* Hangman and Word Display */}
      <div className="section-card">
        <div id="hangman-container">
          <canvas
            ref={canvasRef}
            id="hangman-canvas"
            width="200"
            height="250"
          />
        </div>
        <div id="word-container">{displayedWord.join(" ")}</div>
      </div>

      {/* Letters & Messages */}
      <div className="section-card">
        <div id="letters-container">{renderLetterButtons()}</div>
        <div id="message">{message}</div>
        {definition && <div id="definition-container">{definition}</div>}
        <div id="controls">
          <button id="restart-button" className="btn" onClick={initGame}>
            {translations[language].restartButton}
          </button>
          <button id="hint-button" className="btn" onClick={handleHint}>
            {translations[language].hintButton}
          </button>
          <button
            id="leaderboard-button"
            className="btn"
            onClick={showLeaderboard}
          >
            Show Leaderboard
          </button>
          {/* Optional: Toggle Music Button */}
          <button
            className="btn"
            style={{ background: "#9b59b6" }}
            onClick={() => setIsMusicPlaying(!isMusicPlaying)}
          >
            {isMusicPlaying ? "Stop Music" : "Play Music"}
          </button>
        </div>
      </div>

      {/* Leaderboard Modal */}
      {isLeaderboardOpen && (
        <div className="modal" onClick={closeLeaderboard}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-button" onClick={closeLeaderboard}>
              &times;
            </span>
            <h2 id="leaderboard-title">
              {translations[language].leaderboardTitle}
            </h2>
            <div id="leaderboard-content">
              {leaderboard.length === 0 ? (
                <p>No games played yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Result</th>
                      <th>Word</th>
                      <th>Difficulty</th>
                      <th>Language</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((game, idx) => (
                      <tr key={idx}>
                        <td>{game.date}</td>
                        <td>{game.result}</td>
                        <td>{game.word}</td>
                        <td>{game.difficulty}</td>
                        <td>{game.language}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
