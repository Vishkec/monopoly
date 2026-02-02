import { PASS_GO_BONUS } from "./data.js";

// Cached UI elements
export const elements = {
  board: document.getElementById("board"),
  dice: document.getElementById("dice"),
  die1: document.getElementById("die1"),
  die2: document.getElementById("die2"),
  rollBtn: document.getElementById("rollBtn"),
  endTurnBtn: document.getElementById("endTurnBtn"),
  buildBtn: document.getElementById("buildBtn"),
  tradeBtn: document.getElementById("tradeBtn"),
  restartBtn: document.getElementById("restartBtn"),
  turnInfo: document.getElementById("turnInfo"),
  playersPanel: document.getElementById("playersPanel"),
  log: document.getElementById("log"),
  modal: document.getElementById("modal"),
  modalTitle: document.getElementById("modalTitle"),
  modalBody: document.getElementById("modalBody"),
  modalActions: document.getElementById("modalActions"),
  setupModal: document.getElementById("setupModal"),
  playerCount: document.getElementById("playerCount"),
  setupPlayers: document.getElementById("setupPlayers"),
  startGameBtn: document.getElementById("startGameBtn"),
  roomModal: document.getElementById("roomModal"),
  roomName: document.getElementById("roomName"),
  roomColor: document.getElementById("roomColor"),
  roomCode: document.getElementById("roomCode"),
  createRoomBtn: document.getElementById("createRoomBtn"),
  joinRoomBtn: document.getElementById("joinRoomBtn"),
  roomCodeDisplay: document.getElementById("roomCodeDisplay"),
  roomStatus: document.getElementById("roomStatus")
};

// Map the 40 tiles around an 11x11 grid
export const tilePositions = (() => {
  const positions = [];
  for (let i = 0; i < 40; i += 1) {
    if (i <= 10) {
      positions.push({ row: 11, col: 11 - i });
    } else if (i <= 20) {
      positions.push({ row: 11 - (i - 10), col: 1 });
    } else if (i <= 30) {
      positions.push({ row: 1, col: 1 + (i - 20) });
    } else {
      positions.push({ row: 1 + (i - 30), col: 11 });
    }
  }
  return positions;
})();

// Render board tiles
export const renderBoard = (state) => {
  const center = elements.board.querySelector(".board__center");
  elements.board.innerHTML = "";
  if (center) {
    elements.board.appendChild(center);
  }
  state.tiles.forEach((tile, index) => {
    const position = tilePositions[index];
    const tileEl = document.createElement("div");
    tileEl.className = `tile ${tile.type === "property" ? "property" : ""} ${["go", "jail", "free", "goToJail"].includes(tile.type) ? "corner" : ""}`;
    tileEl.style.gridRow = position.row;
    tileEl.style.gridColumn = position.col;
    tileEl.dataset.id = tile.id;
    if (tile.color) {
      tileEl.dataset.baseColor = tile.color;
    }

    if (tile.type === "property") {
      const flagContent = tile.flagCode
        ? `<img src="https://flagcdn.com/24x18/${tile.flagCode}.png" alt="${tile.country} flag" />`
        : (tile.flag ?? "");
      tileEl.innerHTML = `
        <div class="tile__flag">${flagContent}</div>
        <div class="tile__abbr">${tile.abbr ?? ""}</div>
        <div class="tile__name">${tile.name}</div>
        <div class="tile__price">$${tile.price}</div>
        <div class="tile__buildings"></div>
        <div class="tile__owner-bar">Unowned</div>
        <div class="tile__info-bar">
          <span class="info-pill">🏠 <span class="house-count">0</span></span>
          <span class="info-pill">🏨 <span class="hotel-count">0</span></span>
        </div>
      `;
    } else {
      tileEl.innerHTML = `
        <div class="tile__name">${tile.name}</div>
        ${tile.amount ? `<div class="tile__price">$${tile.amount}</div>` : ""}
        <div class="tile__owner"></div>
      `;
      if (tile.type === "go") tileEl.style.background = "var(--go)";
      if (tile.type === "jail") tileEl.style.background = "var(--jail)";
      if (tile.type === "free") tileEl.style.background = "var(--free)";
      if (tile.type === "tax") tileEl.style.background = "var(--tax)";
      if (tile.type === "chance") tileEl.style.background = "var(--chance)";
      if (tile.type === "community") tileEl.style.background = "var(--community)";
      if (tile.type === "goToJail") tileEl.style.background = "#f97316";
    }
    elements.board.appendChild(tileEl);
  });
};

// Render player tokens on the board
export const renderTokens = (state) => {
  state.players.forEach((player) => {
    let token = elements.board.querySelector(`.token[data-player='${player.id}']`);
    if (player.bankrupt) {
      if (token) token.remove();
      return;
    }

    if (!token) {
      token = document.createElement("div");
      token.className = "token";
      token.dataset.player = player.id;
      elements.board.appendChild(token);
    }

    const tileEl = elements.board.querySelector(`[data-id='${player.position}']`);
    if (!tileEl) return;
    const tileRect = tileEl.getBoundingClientRect();
    const boardRect = elements.board.getBoundingClientRect();
    const size = tileRect.width * 0.5;
    const left = tileRect.left - boardRect.left + (tileRect.width - size) / 2;
    const top = tileRect.top - boardRect.top + (tileRect.height - size) / 2;

    token.style.background = player.color;
    token.style.left = `${left}px`;
    token.style.top = `${top}px`;
    token.textContent = player.name[0];
  });
};

// Render ownership markers and buildings
export const renderOwners = (state) => {
  state.tiles.forEach((tile) => {
    const tileEl = elements.board.querySelector(`[data-id='${tile.id}']`);
    if (!tileEl) return;
    const ownerBar = tileEl.querySelector(".tile__owner-bar");
    if (ownerBar) {
      if (tile.owner !== null) {
        ownerBar.textContent = state.players[tile.owner].name;
        ownerBar.style.background = state.players[tile.owner].color;
        ownerBar.style.color = "#fff";
      } else if (tile.color) {
        ownerBar.textContent = "Unowned";
        ownerBar.style.background = tile.color;
        ownerBar.style.color = "#0f172a";
      }
    }

    const buildingContainer = tileEl.querySelector(".tile__buildings");
    if (buildingContainer) {
      buildingContainer.innerHTML = "";
      if (tile.hotel) {
        buildingContainer.appendChild(document.createElement("div")).className = "hotel";
      } else {
        for (let i = 0; i < tile.houses; i += 1) {
          buildingContainer.appendChild(document.createElement("div")).className = "house";
        }
      }
    }

    const houseCount = tileEl.querySelector(".house-count");
    const hotelCount = tileEl.querySelector(".hotel-count");
    if (houseCount) houseCount.textContent = String(tile.houses || 0);
    if (hotelCount) hotelCount.textContent = tile.hotel ? "1" : "0";
  });
};

// Render the side player panel
export const renderPlayersPanel = (state) => {
  elements.playersPanel.innerHTML = "";
  state.players.forEach((player, index) => {
    const card = document.createElement("div");
    card.className = `player-card ${index === state.currentPlayerIndex ? "active" : ""}`;
    card.innerHTML = `
      <div class="player-card__header">
        <strong style="color:${player.color}">${player.name}</strong>
        <span class="badge" style="background:${player.color}">Token</span>
      </div>
      <div>Balance: $${player.money}</div>
      <div class="status">${player.bankrupt ? "Bankrupt" : player.jailed ? `Jailed (${player.jailTurns})` : "Free"}</div>
      <div class="player-card__properties">${player.properties.length ? player.properties.map((id) => state.tiles[id].name).join(", ") : "No properties"}</div>
    `;
    elements.playersPanel.appendChild(card);
  });
};

// Render current turn info
export const renderTurnInfo = (state) => {
  const player = state.players[state.currentPlayerIndex];
  elements.turnInfo.innerHTML = `
    <strong>Current:</strong> ${player.name}<br />
    <strong>Position:</strong> ${state.tiles[player.position].name}<br />
    <strong>Last Roll:</strong> ${state.dice[0]} + ${state.dice[1]}<br />
    <strong>Pass GO Bonus:</strong> $${PASS_GO_BONUS}
  `;
};

// Update dice faces
export const updateDice = (dice) => {
  const renderDie = (value) => {
    const pipMap = {
      1: [5],
      2: [1, 9],
      3: [1, 5, 9],
      4: [1, 3, 7, 9],
      5: [1, 3, 5, 7, 9],
      6: [1, 3, 4, 6, 7, 9]
    };
    const pips = Array.from({ length: 9 }).map((_, idx) => {
      const on = pipMap[value].includes(idx + 1) ? "on" : "";
      return `<span class="pip ${on}"></span>`;
    });
    return `<div class="die-face">${pips.join("")}</div>`;
  };
  elements.die1.innerHTML = renderDie(dice[0]);
  elements.die2.innerHTML = renderDie(dice[1]);
};

export const startDiceRoll = () => {
  elements.dice.classList.add("rolling");
};

export const stopDiceRoll = () => {
  elements.dice.classList.remove("rolling");
};

// Log helper
export const addLog = (state, message) => {
  state.logs.unshift(message);
  elements.log.innerHTML = state.logs.slice(0, 12).map((entry) => `<div>${entry}</div>`).join("");
};

// Generic modal helpers
export const showModal = (title, body, actions = []) => {
  elements.modalTitle.textContent = title;
  elements.modalBody.innerHTML = body;
  elements.modalActions.innerHTML = "";
  actions.forEach((action) => elements.modalActions.appendChild(action));
  elements.modal.classList.add("show");
  elements.modal.setAttribute("aria-hidden", "false");
};

export const hideModal = () => {
  elements.modal.classList.remove("show");
  elements.modal.setAttribute("aria-hidden", "true");
};

export const showSetupModal = () => {
  elements.setupModal.classList.add("show");
  elements.setupModal.setAttribute("aria-hidden", "false");
};

export const hideSetupModal = () => {
  elements.setupModal.classList.remove("show");
  elements.setupModal.setAttribute("aria-hidden", "true");
};

export const buildSetupPlayers = (count, players = [], readOnly = false) => {
  elements.setupPlayers.innerHTML = "";
  for (let i = 0; i < count; i += 1) {
    const player = players[i];
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <label>Player ${i + 1} name</label>
      <input type="text" id="playerName${i}" value="${player?.name || `Player ${i + 1}`}" ${readOnly ? "disabled" : ""} />
      <label>Player ${i + 1} color</label>
      <input type="color" id="playerColor${i}" value="${player?.color || ["#2563eb", "#dc2626", "#16a34a", "#d97706"][i] || "#2563eb"}" ${readOnly ? "disabled" : ""} />
    `;
    elements.setupPlayers.appendChild(wrapper);
  }
};

export const showRoomModal = () => {
  elements.roomModal.classList.add("show");
  elements.roomModal.setAttribute("aria-hidden", "false");
};

export const hideRoomModal = () => {
  elements.roomModal.classList.remove("show");
  elements.roomModal.setAttribute("aria-hidden", "true");
};
