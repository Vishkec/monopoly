import { createInitialState } from "./state.js";
import { buildSetupPlayers, elements, hideModal, hideRoomModal, hideSetupModal, renderBoard, renderOwners, renderPlayersPanel, renderTokens, renderTurnInfo, showModal, showRoomModal, showSetupModal } from "./ui.js";
import { createButton, endTurn, handleBuild, handleTrade, initializeGame, payJailFine, takeTurn, useJailFreeCard } from "./game.js";

// Current game state
let state;
let socket;
let roomCode = null;
let isHost = false;
let localPlayerIndex = null;
let roomPlayers = [];

const canAct = () => {
  if (!state || localPlayerIndex === null) return false;
  return state.currentPlayerIndex === localPlayerIndex;
};

const broadcastState = () => {
  if (!socket || !roomCode || !isHost || !state) return;
  socket.emit("stateUpdate", { roomCode, state });
};

const applyState = (newState) => {
  state = newState;
  renderBoard(state);
  renderOwners(state);
  renderTokens(state);
  renderPlayersPanel(state);
  renderTurnInfo(state);
};

const updateControls = () => {
  const active = canAct();
  elements.rollBtn.disabled = !active;
  elements.buildBtn.disabled = !active;
  elements.tradeBtn.disabled = !active;
};

// Set up UI and event handlers
const setup = () => {
  showRoomModal();
  if (typeof io !== "undefined") {
    socket = io();
  }

  elements.roomStatus.textContent = "";
  elements.roomName.value = "Player";

  elements.createRoomBtn.addEventListener("click", () => {
    if (!socket) return;
    const name = elements.roomName.value.trim() || "Player";
    const color = elements.roomColor.value;
    socket.emit("createRoom", { name, color });
    elements.roomStatus.textContent = "Creating room...";
  });

  elements.joinRoomBtn.addEventListener("click", () => {
    if (!socket) return;
    const name = elements.roomName.value.trim() || "Player";
    const color = elements.roomColor.value;
    const code = elements.roomCode.value.trim();
    if (!code) {
      elements.roomStatus.textContent = "Enter a room code to join.";
      return;
    }
    socket.emit("joinRoom", { roomCode: code, name, color });
    elements.roomStatus.textContent = "Joining room...";
  });

  if (socket) {
    socket.on("roomCreated", (payload) => {
      roomCode = payload.roomCode;
      isHost = payload.isHost;
      localPlayerIndex = payload.playerId;
      roomPlayers = payload.players;
      elements.roomCodeDisplay.textContent = `Room code: ${roomCode}`;
      hideRoomModal();
      showSetupModal();
      elements.playerCount.value = String(roomPlayers.length);
      elements.playerCount.disabled = true;
      buildSetupPlayers(roomPlayers.length, roomPlayers, true);
      elements.roomStatus.textContent = "";
    });

    socket.on("roomJoined", (payload) => {
      roomCode = payload.roomCode;
      isHost = payload.isHost;
      localPlayerIndex = payload.playerId;
      roomPlayers = payload.players;
      elements.roomCodeDisplay.textContent = `Room code: ${roomCode}`;
      hideRoomModal();
      elements.roomStatus.textContent = "";
      elements.roomCode.value = "";
      elements.roomName.value = payload.playerName || elements.roomName.value;
      showModal("Waiting", "Host will start the game.", [createButton("OK", () => hideModal())]);
      updateControls();
    });

    socket.on("roomUpdate", (payload) => {
      roomPlayers = payload.players;
      if (payload.playerId !== undefined) {
        localPlayerIndex = payload.playerId;
      }
      if (isHost) {
        elements.playerCount.value = String(roomPlayers.length);
        buildSetupPlayers(roomPlayers.length, roomPlayers, true);
      }
    });

    socket.on("roomError", (payload) => {
      elements.roomStatus.textContent = payload.message || "Unable to join room.";
    });

    socket.on("stateUpdate", (payload) => {
      if (isHost) return;
      applyState(payload.state);
      updateControls();
    });

    socket.on("actionRequest", async (payload) => {
      if (!isHost || !state) return;
      const { action, playerId } = payload;
      if (state.currentPlayerIndex !== playerId) return;
      if (action === "roll") {
        await takeTurn(state);
      } else if (action === "build") {
        handleBuild(state, state.currentPlayerIndex);
      } else if (action === "trade") {
        handleTrade(state);
      }
      updateControls();
    });
  }

  buildSetupPlayers(Number(elements.playerCount.value));

  elements.playerCount.addEventListener("change", (event) => {
    buildSetupPlayers(Number(event.target.value));
  });

  elements.startGameBtn.addEventListener("click", () => {
    if (!isHost) return;
    const players = roomPlayers.length ? roomPlayers : Array.from({ length: Number(elements.playerCount.value) }).map((_, index) => {
      const nameInput = document.getElementById(`playerName${index}`);
      const colorInput = document.getElementById(`playerColor${index}`);
      return {
        name: nameInput?.value?.trim() || `Player ${index + 1}`,
        color: colorInput?.value || undefined
      };
    });
    state = createInitialState(players);
    state.onChange = () => broadcastState();
    initializeGame(state);
    hideSetupModal();
    elements.endTurnBtn.disabled = true;
    renderOwners(state);
    renderTokens(state);
    renderPlayersPanel(state);
    renderTurnInfo(state);
    broadcastState();
    updateControls();
  });

  elements.rollBtn.addEventListener("click", async () => {
    if (!state || state.turnInProgress) return;
    if (!canAct()) {
      if (socket && roomCode) {
        socket.emit("action", { roomCode, action: "roll", playerId: localPlayerIndex });
      }
      return;
    }
    const player = state.players[state.currentPlayerIndex];
    if (player.jailed) {
      const actions = [
        createButton("Pay Fine", async () => {
          payJailFine(state, player);
          hideModal();
          await takeTurn(state);
          if (state.awaitingDecision) {
            state.autoEndAfterDecision = true;
          } else {
            endTurn(state);
          }
        }, "btn primary")
      ];

      if (player.jailFreeCards > 0) {
        actions.push(
          createButton("Use Jail Free", async () => {
            useJailFreeCard(state, player);
            hideModal();
            await takeTurn(state);
            if (state.awaitingDecision) {
              state.autoEndAfterDecision = true;
            } else {
              endTurn(state);
            }
          })
        );
      }

      actions.push(
        createButton("Roll for Doubles", async () => {
          hideModal();
          await takeTurn(state);
          if (state.awaitingDecision) {
            state.autoEndAfterDecision = true;
          } else {
            endTurn(state);
          }
        })
      );

      showModal("Jail Options", "Choose how to attempt leaving Jail.", actions);
      return;
    }

    await takeTurn(state);
    if (state.awaitingDecision) {
      state.autoEndAfterDecision = true;
    } else {
      endTurn(state);
    }
    updateControls();
  });

  elements.endTurnBtn.addEventListener("click", () => {
    if (!state) return;
    endTurn(state);
    elements.endTurnBtn.disabled = true;
  });

  elements.buildBtn.addEventListener("click", () => {
    if (!state) return;
    if (!canAct()) {
      if (socket && roomCode) {
        socket.emit("action", { roomCode, action: "build", playerId: localPlayerIndex });
      }
      return;
    }
    handleBuild(state, state.currentPlayerIndex);
  });

  elements.tradeBtn.addEventListener("click", () => {
    if (!state) return;
    if (!canAct()) {
      if (socket && roomCode) {
        socket.emit("action", { roomCode, action: "trade", playerId: localPlayerIndex });
      }
      return;
    }
    handleTrade(state);
  });

  elements.restartBtn.addEventListener("click", () => {
    if (!state) return;
    state = null;
    hideModal();
    showSetupModal();
  });
};

setup();
