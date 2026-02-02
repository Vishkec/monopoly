import { BOARD_TILES, JAIL_FINE, PASS_GO_BONUS, SETS } from "./data.js";
import { CHANCE_CARDS, COMMUNITY_CARDS } from "./cards.js";
import { addLog, hideModal, renderBoard, renderOwners, renderPlayersPanel, renderTokens, renderTurnInfo, showModal, startDiceRoll, stopDiceRoll, updateDice } from "./ui.js";
import { playCashSound, playDiceSound, playJailSound } from "./sound.js";

// Utility: Shuffle decks for cards
const shuffle = (array) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const notify = (state) => {
  if (typeof state.onChange === "function") {
    state.onChange();
  }
};

export const initializeGame = (state) => {
  state.chanceDeck = shuffle(CHANCE_CARDS);
  state.communityDeck = shuffle(COMMUNITY_CARDS);
  state.logs = [];
  state.turnInProgress = false;
  state.doublesStreak = 0;
  state.awaitingDecision = false;
  state.autoEndAfterDecision = false;
  renderBoard(state);
  renderOwners(state);
  renderTokens(state);
  renderPlayersPanel(state);
  renderTurnInfo(state);
  addLog(state, "Game started!");
};

// Dice animation and result
export const rollDice = (state) => {
  const dice = [1, 1];
  const cycles = 8;
  let count = 0;
  return new Promise((resolve) => {
    startDiceRoll();
    const interval = setInterval(() => {
      dice[0] = Math.floor(Math.random() * 6) + 1;
      dice[1] = Math.floor(Math.random() * 6) + 1;
      updateDice(dice);
      count += 1;
      if (count >= cycles) {
        clearInterval(interval);
        stopDiceRoll();
        playDiceSound();
        resolve(dice);
      }
    }, 60);
  });
};

// Move player by N steps, pay bonus when passing GO
export const movePlayer = (state, player, steps) => {
  const oldPos = player.position;
  let newPos = (player.position + steps) % BOARD_TILES.length;
  if (newPos < 0) newPos += BOARD_TILES.length;
  if (steps > 0 && oldPos + steps >= BOARD_TILES.length) {
    player.money += PASS_GO_BONUS;
    addLog(state, `${player.name} passed GO and collected $${PASS_GO_BONUS}`);
    playCashSound();
  }
  player.position = newPos;
};

// Send player to jail
const sendToJail = (state, player) => {
  player.jailed = true;
  player.jailTurns = 0;
  player.position = 10;
  state.doublesStreak = 0;
  addLog(state, `${player.name} was sent to Jail.`);
  playJailSound();
};

// Transfer assets or reset on bankruptcy
const applyBankruptcy = (state, player, creditorIndex = null) => {
  player.bankrupt = true;
  player.money = 0;
  player.properties.forEach((id) => {
    const tile = state.tiles[id];
    if (creditorIndex !== null) {
      tile.owner = creditorIndex;
      state.players[creditorIndex].properties.push(id);
    } else {
      tile.owner = null;
    }
    tile.houses = 0;
    tile.hotel = false;
  });
  player.properties = [];
  addLog(state, `${player.name} is bankrupt.`);
  notify(state);
};

// Charge player and handle bankruptcy
const chargePlayer = (state, player, amount, creditorIndex = null) => {
  player.money -= amount;
  if (creditorIndex !== null) {
    state.players[creditorIndex].money += amount;
  }
  if (player.money < 0) {
    applyBankruptcy(state, player, creditorIndex);
  }
  notify(state);
};

// Calculate rent helpers
const getRailroadRent = (state, ownerIndex) => {
  const owned = state.tiles.filter((tile) => tile.type === "railroad" && tile.owner === ownerIndex).length;
  const rentTable = [25, 50, 100, 200];
  return rentTable[owned - 1] || 25;
};

const getUtilityRent = (state, ownerIndex, diceTotal) => {
  const owned = state.tiles.filter((tile) => tile.type === "utility" && tile.owner === ownerIndex).length;
  return diceTotal * (owned === 2 ? 10 : 4);
};

const getPropertyRent = (tile) => {
  if (tile.hotel) return tile.rent[5];
  if (tile.houses > 0) return tile.rent[tile.houses];
  return tile.rent[0];
};

// Check if player owns all tiles in a color set
const playerOwnsSet = (state, playerIndex, color) => {
  const setTiles = SETS[color] || [];
  return setTiles.every((id) => state.tiles[id].owner === playerIndex);
};

// Buildable properties for a player
const getAvailableBuilds = (state, playerIndex) => {
  return state.tiles
    .filter((tile) => tile.type === "property" && tile.owner === playerIndex && playerOwnsSet(state, playerIndex, tile.color))
    .filter((tile) => !tile.hotel)
    .map((tile) => ({
      id: tile.id,
      name: tile.name,
      cost: tile.houseCost,
      houses: tile.houses,
      canHotel: tile.houses >= 4
    }));
};

export const handleBuild = (state, playerIndex) => {
  const player = state.players[playerIndex];
  const builds = getAvailableBuilds(state, playerIndex);
  if (!builds.length) {
    showModal("No Builds", "You do not own a full set yet.", [createButton("OK", () => hideModal())]);
    return;
  }

  const options = builds
    .map((build) => {
      const label = build.canHotel ? `Hotel on ${build.name}` : `House on ${build.name}`;
      return `<option value="${build.id}">${label} - $${build.cost}</option>`;
    })
    .join("");

  showModal(
    "Buy Buildings",
    `<label for="buildSelect">Select property</label>
     <select id="buildSelect">${options}</select>`,
    [
      createButton("Buy", () => {
        const id = Number(document.getElementById("buildSelect").value);
        const tile = state.tiles[id];
        if (player.money < tile.houseCost) {
          addLog(state, `${player.name} cannot afford building.`);
        } else {
          player.money -= tile.houseCost;
          if (tile.houses >= 4) {
            tile.hotel = true;
            tile.houses = 0;
          } else {
            tile.houses += 1;
          }
          addLog(state, `${player.name} built on ${tile.name}.`);
          playCashSound();
            notify(state);
        }
        hideModal();
        renderOwners(state);
        renderPlayersPanel(state);
      }),
      createButton("Cancel", () => hideModal())
    ]
  );
};

export const createButton = (label, onClick, classes = "btn") => {
  const button = document.createElement("button");
  button.className = classes;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
};

export const handleTrade = (state) => {
  const currentPlayer = state.players[state.currentPlayerIndex];
  const otherPlayers = state.players.filter((p) => p.id !== currentPlayer.id && !p.bankrupt);
  if (!otherPlayers.length) {
    showModal("Trade", "No available players to trade with.", [createButton("OK", () => hideModal(), "btn primary")]);
    return;
  }

  const openTradeWith = (targetId) => {
    const target = state.players[targetId];
    const renderPropertyList = (player, containerId) => {
      const items = player.properties
        .map((id) => {
          const tile = state.tiles[id];
          return `
            <button class="trade__item" data-id="${id}">
              <span class="trade__flag">${tile.flagCode ? `<img src="https://flagcdn.com/24x18/${tile.flagCode}.png" alt="${tile.country}" />` : (tile.flag ?? "")}</span>
              <span>${tile.name}</span>
              <span class="trade__price">$${tile.price}</span>
            </button>
          `;
        })
        .join("");
      return items || `<div class="trade__empty">No properties</div>`;
    };

    showModal(
      "Create a trade",
      `
        <div class="trade">
          <div class="trade__panel">
            <div class="trade__header">
              <span class="trade__name" style="color:${currentPlayer.color}">${currentPlayer.name}</span>
              <span>$${currentPlayer.money}</span>
            </div>
            <div class="trade__slider">
              <input type="range" min="0" max="${currentPlayer.money}" value="0" id="offerMoney" />
              <div class="trade__amount" id="offerMoneyValue">0 $</div>
            </div>
            <div class="trade__list" id="offerProps">${renderPropertyList(currentPlayer)}</div>
          </div>
          <div class="trade__swap">↔</div>
          <div class="trade__panel">
            <div class="trade__header">
              <span class="trade__name" style="color:${target.color}">${target.name}</span>
              <span>$${target.money}</span>
            </div>
            <div class="trade__slider">
              <input type="range" min="0" max="${target.money}" value="0" id="requestMoney" />
              <div class="trade__amount" id="requestMoneyValue">0 $</div>
            </div>
            <div class="trade__list" id="requestProps">${renderPropertyList(target)}</div>
          </div>
        </div>
      `,
      [
        createButton("Send Trade", () => {
          const offerMoney = Number(document.getElementById("offerMoney").value || 0);
          const requestMoney = Number(document.getElementById("requestMoney").value || 0);
          const offerSelected = document.querySelector("#offerProps .trade__item.selected");
          const requestSelected = document.querySelector("#requestProps .trade__item.selected");
          const offerPropertyId = offerSelected ? Number(offerSelected.dataset.id) : null;
          const requestPropertyId = requestSelected ? Number(requestSelected.dataset.id) : null;

          if (!offerPropertyId && !requestPropertyId && offerMoney === 0 && requestMoney === 0) {
            addLog(state, "Select a property or money to trade.");
            return;
          }

          if (offerMoney > currentPlayer.money || requestMoney > target.money) {
            addLog(state, "Trade amounts exceed available money.");
            return;
          }

          const summary = `${currentPlayer.name} offers ${offerMoney ? `$${offerMoney}` : ""}${offerPropertyId ? ` and ${state.tiles[offerPropertyId].name}` : ""} for ${requestMoney ? `$${requestMoney}` : ""}${requestPropertyId ? ` and ${state.tiles[requestPropertyId].name}` : ""}.`;

          showModal("Trade Offer", `${summary} Accept?`, [
            createButton("Accept", () => {
              currentPlayer.money -= offerMoney;
              target.money += offerMoney;
              target.money -= requestMoney;
              currentPlayer.money += requestMoney;

              if (offerPropertyId !== null) {
                currentPlayer.properties = currentPlayer.properties.filter((id) => id !== offerPropertyId);
                target.properties.push(offerPropertyId);
                state.tiles[offerPropertyId].owner = target.id;
              }

              if (requestPropertyId !== null) {
                target.properties = target.properties.filter((id) => id !== requestPropertyId);
                currentPlayer.properties.push(requestPropertyId);
                state.tiles[requestPropertyId].owner = currentPlayer.id;
              }

              addLog(state, `${target.name} accepted trade with ${currentPlayer.name}.`);
              hideModal();
              renderOwners(state);
              renderPlayersPanel(state);
              notify(state);
            }, "btn primary"),
            createButton("Decline", () => hideModal())
          ]);
        }, "btn primary"),
        createButton("Cancel", () => hideModal())
      ]
    );

    setTimeout(() => {
      const offerMoney = document.getElementById("offerMoney");
      const requestMoney = document.getElementById("requestMoney");
      const offerValue = document.getElementById("offerMoneyValue");
      const requestValue = document.getElementById("requestMoneyValue");

      if (offerMoney && offerValue) {
        offerMoney.addEventListener("input", () => {
          offerValue.textContent = `${offerMoney.value} $`;
        });
      }

      if (requestMoney && requestValue) {
        requestMoney.addEventListener("input", () => {
          requestValue.textContent = `${requestMoney.value} $`;
        });
      }

      const bindList = (selector) => {
        document.querySelectorAll(`${selector} .trade__item`).forEach((item) => {
          item.addEventListener("click", () => {
            document.querySelectorAll(`${selector} .trade__item`).forEach((el) => el.classList.remove("selected"));
            item.classList.add("selected");
          });
        });
      };

      bindList("#offerProps");
      bindList("#requestProps");
    }, 0);
  };

  const playerButtons = otherPlayers
    .map(
      (p) => `
        <button class="trade-player" data-player="${p.id}">
          <span class="trade-player__dot" style="background:${p.color}"></span>
          <span>${p.name}</span>
        </button>
      `
    )
    .join("");

  showModal(
    "Create a trade",
    `<div class="trade-player-list">${playerButtons}</div>`,
    [createButton("Cancel", () => hideModal())]
  );

  setTimeout(() => {
    document.querySelectorAll(".trade-player").forEach((button) => {
      button.addEventListener("click", () => {
        const id = Number(button.dataset.player);
        openTradeWith(id);
      });
    });
  }, 0);
};

const createDecisionButton = (state, label, onClick, classes = "btn") => {
  return createButton(label, () => {
    onClick();
    state.awaitingDecision = false;
    if (state.autoEndAfterDecision) {
      state.autoEndAfterDecision = false;
      endTurn(state);
    }
  }, classes);
};

const formatRentTable = (tile) => {
  return `Normal: $${tile.rent[0]}<br />1 House: $${tile.rent[1]}<br />2 Houses: $${tile.rent[2]}<br />3 Houses: $${tile.rent[3]}<br />4 Houses: $${tile.rent[4]}<br />Hotel: $${tile.rent[5]}`;
};

const handlePropertyLanding = (state, player, tile) => {
  if (tile.owner === null) {
    state.awaitingDecision = true;
    showModal(
      `Buy ${tile.name}?`,
      `${tile.country}<br />Price: $${tile.price}<br /><br /><strong>Rent</strong><br />${formatRentTable(tile)}`,
      [
        createDecisionButton(state, "Buy", () => {
          if (player.money >= tile.price) {
            player.money -= tile.price;
            tile.owner = player.id;
            player.properties.push(tile.id);
            addLog(state, `${player.name} bought ${tile.name}.`);
            playCashSound();
            notify(state);
          } else {
            addLog(state, `${player.name} cannot afford ${tile.name}.`);
          }
          hideModal();
          renderOwners(state);
          renderPlayersPanel(state);
        }, "btn primary"),
        createDecisionButton(state, "Skip", () => hideModal())
      ]
    );
  } else if (tile.owner !== player.id) {
    const owner = state.players[tile.owner];
    const rent = getPropertyRent(tile);
    state.awaitingDecision = true;
    showModal(
      "Pay Rent",
      `${player.name} owes ${owner.name} $${rent}.`,
      [
        createDecisionButton(state, "Pay", () => {
          chargePlayer(state, player, rent, owner.id);
          addLog(state, `${player.name} paid $${rent} to ${owner.name}.`);
          hideModal();
          renderPlayersPanel(state);
          notify(state);
        }, "btn primary")
      ]
    );
  }
};

const handleRailroadLanding = (state, player, tile) => {
  if (tile.owner === null) {
    state.awaitingDecision = true;
    showModal(
      `Buy ${tile.name}?`,
      `Price: $${tile.price}`,
      [
        createDecisionButton(state, "Buy", () => {
          if (player.money >= tile.price) {
            player.money -= tile.price;
            tile.owner = player.id;
            player.properties.push(tile.id);
            addLog(state, `${player.name} bought ${tile.name}.`);
            playCashSound();
            notify(state);
          }
          hideModal();
          renderOwners(state);
          renderPlayersPanel(state);
        }, "btn primary"),
        createDecisionButton(state, "Skip", () => hideModal())
      ]
    );
  } else if (tile.owner !== player.id) {
    const owner = state.players[tile.owner];
    const rent = getRailroadRent(state, owner.id);
    state.awaitingDecision = true;
    showModal(
      "Pay Station Rent",
      `${player.name} owes ${owner.name} $${rent}.`,
      [
        createDecisionButton(state, "Pay", () => {
          chargePlayer(state, player, rent, owner.id);
          addLog(state, `${player.name} paid $${rent} to ${owner.name}.`);
          hideModal();
          renderPlayersPanel(state);
          notify(state);
        }, "btn primary")
      ]
    );
  }
};

const handleUtilityLanding = (state, player, tile, diceTotal) => {
  if (tile.owner === null) {
    state.awaitingDecision = true;
    showModal(
      `Buy ${tile.name}?`,
      `Price: $${tile.price}`,
      [
        createDecisionButton(state, "Buy", () => {
          if (player.money >= tile.price) {
            player.money -= tile.price;
            tile.owner = player.id;
            player.properties.push(tile.id);
            addLog(state, `${player.name} bought ${tile.name}.`);
            playCashSound();
            notify(state);
          }
          hideModal();
          renderOwners(state);
          renderPlayersPanel(state);
        }, "btn primary"),
        createDecisionButton(state, "Skip", () => hideModal())
      ]
    );
  } else if (tile.owner !== player.id) {
    const owner = state.players[tile.owner];
    const rent = getUtilityRent(state, owner.id, diceTotal);
    state.awaitingDecision = true;
    showModal(
      "Pay Utility",
      `${player.name} owes ${owner.name} $${rent}.`,
      [
        createDecisionButton(state, "Pay", () => {
          chargePlayer(state, player, rent, owner.id);
          addLog(state, `${player.name} paid $${rent} to ${owner.name}.`);
          hideModal();
          renderPlayersPanel(state);
          notify(state);
        }, "btn primary")
      ]
    );
  }
};

const drawCard = (state, deckType) => {
  const deck = deckType === "chance" ? state.chanceDeck : state.communityDeck;
  const card = deck.shift();
  deck.push(card);
  return card;
};

// Resolve Chance / Community Chest cards
const handleCard = (state, player, deckType) => {
  const card = drawCard(state, deckType);
  const action = () => {
    switch (card.action) {
      case "money":
        player.money += card.value;
        addLog(state, `${player.name}: ${card.text}`);
        if (card.value > 0) playCashSound();
        notify(state);
        break;
      case "move":
        movePlayer(state, player, card.value - player.position);
        addLog(state, `${player.name}: ${card.text}`);
        handleLanding(state, player, state.dice[0] + state.dice[1]);
        notify(state);
        break;
      case "moveSteps":
        movePlayer(state, player, card.value);
        addLog(state, `${player.name}: ${card.text}`);
        handleLanding(state, player, state.dice[0] + state.dice[1]);
        notify(state);
        break;
      case "jail":
        sendToJail(state, player);
        notify(state);
        break;
      case "nearestRail": {
        const nextRail = state.tiles.find((tile, index) => index > player.position && tile.type === "railroad") || state.tiles.find((tile) => tile.type === "railroad");
        movePlayer(state, player, nextRail.id - player.position);
        addLog(state, `${player.name}: ${card.text}`);
        handleLanding(state, player, state.dice[0] + state.dice[1]);
        notify(state);
        break;
      }
      case "jailFree":
        player.jailFreeCards += 1;
        addLog(state, `${player.name} received a Get Out of Jail Free card.`);
        notify(state);
        break;
      default:
        break;
    }
  };

  state.awaitingDecision = true;
  showModal("Card", `<strong>${deckType === "chance" ? "Chance" : "Community Chest"}</strong><p>${card.text}</p>`, [
    createDecisionButton(state, "OK", () => {
      hideModal();
      action();
      renderPlayersPanel(state);
      renderTokens(state);
      renderOwners(state);
    }, "btn primary")
  ]);
};

const handleTax = (state, player, tile) => {
  state.awaitingDecision = true;
  showModal("Pay Tax", `${tile.name}: Pay $${tile.amount}`, [
    createDecisionButton(state, "Pay", () => {
      chargePlayer(state, player, tile.amount);
      addLog(state, `${player.name} paid $${tile.amount} in taxes.`);
      hideModal();
      renderPlayersPanel(state);
      notify(state);
    }, "btn primary")
  ]);
};

// Process landing logic by tile type
const handleLanding = (state, player, diceTotal) => {
  const tile = state.tiles[player.position];
  switch (tile.type) {
    case "property":
      handlePropertyLanding(state, player, tile);
      break;
    case "railroad":
      handleRailroadLanding(state, player, tile);
      break;
    case "utility":
      handleUtilityLanding(state, player, tile, diceTotal);
      break;
    case "chance":
      handleCard(state, player, "chance");
      break;
    case "community":
      handleCard(state, player, "community");
      break;
    case "tax":
      handleTax(state, player, tile);
      break;
    case "goToJail":
      sendToJail(state, player);
      break;
    default:
      break;
  }
};

// Jail logic when player chooses to roll
const handleJailTurn = (state, player, dice) => {
  const isDouble = dice[0] === dice[1];
  if (isDouble) {
    player.jailed = false;
    player.jailTurns = 0;
    addLog(state, `${player.name} rolled doubles and left Jail.`);
    return true;
  }

  player.jailTurns += 1;
  if (player.jailTurns >= 3) {
    player.jailed = false;
    player.jailTurns = 0;
    chargePlayer(state, player, JAIL_FINE);
    addLog(state, `${player.name} paid $${JAIL_FINE} to leave Jail.`);
    return true;
  }
  addLog(state, `${player.name} remains in Jail.`);
  return false;
};

export const payJailFine = (state, player) => {
  chargePlayer(state, player, JAIL_FINE);
  player.jailed = false;
  player.jailTurns = 0;
  addLog(state, `${player.name} paid $${JAIL_FINE} to leave Jail.`);
  notify(state);
};

export const useJailFreeCard = (state, player) => {
  if (player.jailFreeCards <= 0) return false;
  player.jailFreeCards -= 1;
  player.jailed = false;
  player.jailTurns = 0;
  addLog(state, `${player.name} used a Get Out of Jail Free card.`);
  notify(state);
  return true;
};

// Main turn flow
export const takeTurn = async (state) => {
  const player = state.players[state.currentPlayerIndex];
  if (player.bankrupt) {
    return;
  }
  state.turnInProgress = true;
  state.awaitingDecision = false;
  const dice = await rollDice(state);
  state.dice = dice;
  const total = dice[0] + dice[1];

  if (player.jailed) {
    const canMove = handleJailTurn(state, player, dice);
    if (!canMove) {
      state.turnInProgress = false;
      renderPlayersPanel(state);
      renderTurnInfo(state);
      return;
    }
  }

  state.doublesStreak = 0;

  movePlayer(state, player, total);
  renderTokens(state);
  handleLanding(state, player, total);

  renderPlayersPanel(state);
  renderTurnInfo(state);
  state.turnInProgress = false;
  notify(state);
};

export function endTurn(state) {
  state.turnInProgress = false;
  state.awaitingDecision = false;
  const activePlayers = state.players.filter((p) => !p.bankrupt);
  if (activePlayers.length === 1) {
    showModal("Game Over", `${activePlayers[0].name} wins!`, [createButton("OK", () => hideModal(), "btn primary")]);
    return;
  }
  do {
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  } while (state.players[state.currentPlayerIndex].bankrupt);
  renderTurnInfo(state);
  renderPlayersPanel(state);
  addLog(state, `Turn: ${state.players[state.currentPlayerIndex].name}`);
  notify(state);
}
