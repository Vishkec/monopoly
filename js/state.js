import { BOARD_TILES, PLAYER_COLORS, START_MONEY } from "./data.js";

// Create a single player object
export const createPlayer = (index, name, color) => ({
  id: index,
  name,
  color: color || PLAYER_COLORS[index],
  money: START_MONEY,
  position: 0,
  properties: [],
  jailed: false,
  jailTurns: 0,
  jailFreeCards: 0,
  bankrupt: false
});

// Create a fresh game state
export const createInitialState = (players) => ({
  tiles: BOARD_TILES.map((tile) => ({
    ...tile,
    owner: null,
    houses: 0,
    hotel: false
  })),
  players: players.map((player, index) => createPlayer(index, player.name, player.color)),
  currentPlayerIndex: 0,
  dice: [1, 1],
  doublesStreak: 0,
  awaitingDecision: false,
  autoEndAfterDecision: false,
  turnInProgress: false,
  logs: [],
  chanceDeck: [],
  communityDeck: [],
  onChange: null
});
