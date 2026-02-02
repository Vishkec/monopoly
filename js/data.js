// Shared game constants and board layout
export const PLAYER_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#d97706"
];

// 40-tile Monopoly-style board
export const BOARD_TILES = [
  { id: 0, type: "go", name: "GO", action: "collect" },
  { id: 1, type: "property", name: "Lisbon", country: "Portugal", abbr: "POR", flag: "🇵🇹", flagCode: "pt", price: 60, rent: [2, 10, 30, 90, 160, 250], color: "#b89b6c", houseCost: 50 },
  { id: 2, type: "community", name: "Community Chest" },
  { id: 3, type: "property", name: "Porto", country: "Portugal", abbr: "POR", flag: "🇵🇹", flagCode: "pt", price: 60, rent: [4, 20, 60, 180, 320, 450], color: "#b89b6c", houseCost: 50 },
  { id: 4, type: "tax", name: "Income Tax", amount: 200 },
  { id: 5, type: "railroad", name: "North Station", price: 200, rent: [25, 50, 100, 200] },
  { id: 6, type: "property", name: "Dublin", country: "Ireland", abbr: "IRL", flag: "🇮🇪", flagCode: "ie", price: 100, rent: [6, 30, 90, 270, 400, 550], color: "#9ad0f5", houseCost: 50 },
  { id: 7, type: "chance", name: "Chance" },
  { id: 8, type: "property", name: "Cork", country: "Ireland", abbr: "IRL", flag: "🇮🇪", flagCode: "ie", price: 100, rent: [6, 30, 90, 270, 400, 550], color: "#9ad0f5", houseCost: 50 },
  { id: 9, type: "property", name: "Galway", country: "Ireland", abbr: "IRL", flag: "🇮🇪", flagCode: "ie", price: 120, rent: [8, 40, 100, 300, 450, 600], color: "#9ad0f5", houseCost: 50 },
  { id: 10, type: "jail", name: "Jail" },
  { id: 11, type: "property", name: "Madrid", country: "Spain", abbr: "ESP", flag: "🇪🇸", flagCode: "es", price: 140, rent: [10, 50, 150, 450, 625, 750], color: "#f28fb3", houseCost: 100 },
  { id: 12, type: "utility", name: "Electric Company", price: 150 },
  { id: 13, type: "property", name: "Barcelona", country: "Spain", abbr: "ESP", flag: "🇪🇸", flagCode: "es", price: 140, rent: [10, 50, 150, 450, 625, 750], color: "#f28fb3", houseCost: 100 },
  { id: 14, type: "property", name: "Valencia", country: "Spain", abbr: "ESP", flag: "🇪🇸", flagCode: "es", price: 160, rent: [12, 60, 180, 500, 700, 900], color: "#f28fb3", houseCost: 100 },
  { id: 15, type: "railroad", name: "Central Station", price: 200, rent: [25, 50, 100, 200] },
  { id: 16, type: "property", name: "Berlin", country: "Germany", abbr: "DEU", flag: "🇩🇪", flagCode: "de", price: 180, rent: [14, 70, 200, 550, 750, 950], color: "#f0b35a", houseCost: 100 },
  { id: 17, type: "community", name: "Community Chest" },
  { id: 18, type: "property", name: "Hamburg", country: "Germany", abbr: "DEU", flag: "🇩🇪", flagCode: "de", price: 180, rent: [14, 70, 200, 550, 750, 950], color: "#f0b35a", houseCost: 100 },
  { id: 19, type: "property", name: "Munich", country: "Germany", abbr: "DEU", flag: "🇩🇪", flagCode: "de", price: 200, rent: [16, 80, 220, 600, 800, 1000], color: "#f0b35a", houseCost: 100 },
  { id: 20, type: "free", name: "Free Parking" },
  { id: 21, type: "property", name: "Milan", country: "Italy", abbr: "ITA", flag: "🇮🇹", flagCode: "it", price: 220, rent: [18, 90, 250, 700, 875, 1050], color: "#ff6b6b", houseCost: 150 },
  { id: 22, type: "chance", name: "Chance" },
  { id: 23, type: "property", name: "Rome", country: "Italy", abbr: "ITA", flag: "🇮🇹", flagCode: "it", price: 220, rent: [18, 90, 250, 700, 875, 1050], color: "#ff6b6b", houseCost: 150 },
  { id: 24, type: "property", name: "Venice", country: "Italy", abbr: "ITA", flag: "🇮🇹", flagCode: "it", price: 240, rent: [20, 100, 300, 750, 925, 1100], color: "#ff6b6b", houseCost: 150 },
  { id: 25, type: "railroad", name: "West Station", price: 200, rent: [25, 50, 100, 200] },
  { id: 26, type: "property", name: "Oslo", country: "Norway", abbr: "NOR", flag: "🇳🇴", flagCode: "no", price: 260, rent: [22, 110, 330, 800, 975, 1150], color: "#6bcfbe", houseCost: 150 },
  { id: 27, type: "property", name: "Bergen", country: "Norway", abbr: "NOR", flag: "🇳🇴", flagCode: "no", price: 260, rent: [22, 110, 330, 800, 975, 1150], color: "#6bcfbe", houseCost: 150 },
  { id: 28, type: "utility", name: "Water Works", price: 150 },
  { id: 29, type: "property", name: "Trondheim", country: "Norway", abbr: "NOR", flag: "🇳🇴", flagCode: "no", price: 280, rent: [24, 120, 360, 850, 1025, 1200], color: "#6bcfbe", houseCost: 150 },
  { id: 30, type: "goToJail", name: "Go To Jail" },
  { id: 31, type: "property", name: "Tokyo", country: "Japan", abbr: "JPN", flag: "🇯🇵", flagCode: "jp", price: 300, rent: [26, 130, 390, 900, 1100, 1275], color: "#8b5cf6", houseCost: 200 },
  { id: 32, type: "property", name: "Osaka", country: "Japan", abbr: "JPN", flag: "🇯🇵", flagCode: "jp", price: 300, rent: [26, 130, 390, 900, 1100, 1275], color: "#8b5cf6", houseCost: 200 },
  { id: 33, type: "community", name: "Community Chest" },
  { id: 34, type: "property", name: "Kyoto", country: "Japan", abbr: "JPN", flag: "🇯🇵", flagCode: "jp", price: 320, rent: [28, 150, 450, 1000, 1200, 1400], color: "#8b5cf6", houseCost: 200 },
  { id: 35, type: "railroad", name: "South Station", price: 200, rent: [25, 50, 100, 200] },
  { id: 36, type: "chance", name: "Chance" },
  { id: 37, type: "property", name: "Mumbai", country: "India", abbr: "IND", flag: "🇮🇳", flagCode: "in", price: 350, rent: [35, 175, 500, 1100, 1300, 1500], color: "#111827", houseCost: 200 },
  { id: 38, type: "tax", name: "Luxury Tax", amount: 100 },
  { id: 39, type: "property", name: "Delhi", country: "India", abbr: "IND", flag: "🇮🇳", flagCode: "in", price: 400, rent: [50, 200, 600, 1400, 1700, 2000], color: "#111827", houseCost: 200 }
];

// Color sets for building eligibility
export const SETS = {
  "#b89b6c": [1, 3],
  "#9ad0f5": [6, 8, 9],
  "#f28fb3": [11, 13, 14],
  "#f0b35a": [16, 18, 19],
  "#ff6b6b": [21, 23, 24],
  "#6bcfbe": [26, 27, 29],
  "#8b5cf6": [31, 32, 34],
  "#111827": [37, 39]
};

export const START_MONEY = 1500;
export const PASS_GO_BONUS = 200;
export const JAIL_FINE = 50;
