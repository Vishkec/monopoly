export const CHANCE_CARDS = [
  { text: "Advance to GO", action: "move", value: 0 },
  { text: "Go to Jail", action: "jail" },
  { text: "Bank pays you dividend of $50", action: "money", value: 50 },
  { text: "Pay poor tax of $15", action: "money", value: -15 },
  { text: "Advance to Tokyo", action: "move", value: 31 },
  { text: "Advance to nearest station", action: "nearestRail" },
  { text: "Get out of jail free", action: "jailFree" },
  { text: "Go back 3 spaces", action: "moveSteps", value: -3 }
];

export const COMMUNITY_CARDS = [
  { text: "Doctor's fees. Pay $50", action: "money", value: -50 },
  { text: "From sale of stock you get $50", action: "money", value: 50 },
  { text: "Go to Jail", action: "jail" },
  { text: "Income tax refund. Collect $20", action: "money", value: 20 },
  { text: "Life insurance matures. Collect $100", action: "money", value: 100 },
  { text: "Pay school fees of $50", action: "money", value: -50 },
  { text: "You inherit $100", action: "money", value: 100 },
  { text: "Get out of jail free", action: "jailFree" }
];
