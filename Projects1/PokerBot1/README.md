# ♠ Texas Hold'em Poker Bot ♠

A fully playable **Texas Hold'em poker game** against a strategic AI bot, built entirely in Python with no external dependencies.

![Python](https://img.shields.io/badge/Python-3.x-blue) ![GUI](https://img.shields.io/badge/GUI-tkinter-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🚀 Getting Started

### Requirements
- **Python 3.x** (no additional packages needed — uses only the standard library)

### Running the Game
```bash
python "Poker Bot.py"
```

---

## 🎮 How to Play

1. **Launch** the game — your two hole cards appear face-up at the bottom of the table
2. **Choose an action** each betting round:
   - **Fold** — give up your hand
   - **Check / Call** — match the current bet (or check if no bet)
   - **Raise** — increase the bet using the slider
3. **Community cards** are dealt across rounds: Flop (3 cards) → Turn (1 card) → River (1 card)
4. **Showdown** — if both players are still in after the river, the best 5-card hand wins
5. Click **New Hand** to deal the next round

### Poker Hand Rankings (Lowest → Highest)

| Rank | Hand | Example |
|------|------|---------|
| 0 | High Card | A♠ K♦ 9♣ 7♥ 3♠ |
| 1 | One Pair | K♠ K♦ 9♣ 7♥ 3♠ |
| 2 | Two Pair | K♠ K♦ 9♣ 9♥ 3♠ |
| 3 | Three of a Kind | K♠ K♦ K♣ 7♥ 3♠ |
| 4 | Straight | 5♠ 6♦ 7♣ 8♥ 9♠ |
| 5 | Flush | A♠ J♠ 8♠ 6♠ 3♠ |
| 6 | Full House | K♠ K♦ K♣ 9♥ 9♠ |
| 7 | Four of a Kind | K♠ K♦ K♣ K♥ 3♠ |
| 8 | Straight Flush | 5♠ 6♠ 7♠ 8♠ 9♠ |
| 9 | Royal Flush | 10♠ J♠ Q♠ K♠ A♠ |

---

## 🏗️ Architecture

The game is structured into 5 clean components, all in a single file:

### 1. Card & Deck (~40 lines)
- `Card` class with rank, suit, and numeric value
- `Deck` class: standard 52-card deck with `shuffle()` and `deal()`

### 2. Hand Evaluator (~80 lines)
Determines the best 5-card poker hand from any set of cards (typically 7: your 2 hole cards + 5 community cards).

**How it works:**
1. Generates all possible 5-card combinations from the available cards
2. Scores each combination by checking for flush, straight, pairs, etc.
3. Returns the highest-scoring combination

Scoring uses a **tuple comparison system**: `(HandRank, tiebreaker1, tiebreaker2, ...)`. This means a Flush always beats a Straight (higher HandRank), and two Flushes are compared by their highest cards (tiebreakers).

### 3. Bot AI (~130 lines)
The AI opponent makes decisions using a **3-layer strategy**:

| Phase | Strategy |
|-------|----------|
| **Pre-flop** | Rates starting hands using a lookup table (AA = 0.95, junk = 0.15) |
| **Post-flop** | Evaluates actual hand strength + draw potential (flush draws, straight draws) |
| **Betting** | Compares hand strength vs pot odds, with ~15% bluff frequency |

**Decision flow:**
1. Calculate hand strength (0.0 = trash → 1.0 = nuts)
2. Compare against pot odds (cost-to-call / pot-size)
3. If strength > pot odds → call or raise
4. 15% of the time, play weak hands aggressively (bluff!)
5. Raise amount scales with hand strength (30–100% of pot)

### 4. Game Engine (~200 lines)
Manages the complete Texas Hold'em game flow:

```
Post Blinds → Deal Hole Cards → Pre-flop Betting
    → Deal Flop (3 cards) → Flop Betting
    → Deal Turn (1 card) → Turn Betting
    → Deal River (1 card) → River Betting
    → Showdown
```

Features:
- Heads-up format (1v1)
- Proper blind posting (SB = 10, BB = 20)
- Dealer alternation each hand
- All-in support
- Correct action order (dealer acts first pre-flop, last post-flop)

### 5. GUI (~250 lines)
Canvas-based tkinter interface featuring:
- **Green felt table** with rounded borders
- **Graphical card rendering** (rank + suit drawn on canvas)
- **Card backs** for the bot's hidden cards
- **Chip counts** and pot display
- **Action buttons** (Fold / Check-Call / Raise) with a raise slider
- **Scrollable game log** showing all actions
- **Winner banner** at showdown

---

## 🔧 Technical Details

### Dependencies
Only Python standard library modules:
- `tkinter` — GUI framework
- `random` — deck shuffling and bot randomness
- `collections.Counter` — counting card ranks/suits
- `enum.IntEnum` — hand ranking enumeration
- `itertools.combinations` — generating 5-card combos from 7

### Key Design Decisions

- **Single file**: Easy to share, run, and understand — no project setup needed
- **Tuple-based hand scoring**: Enables simple `>` comparison between any two hands with automatic tiebreaking
- **Bot bluffing**: A fixed 15% bluff rate makes the bot unpredictable without being irrational
- **Canvas rendering**: Cards are drawn as shapes/text rather than images, so no asset files are needed

---

## 📜 License

This project is open source and free to use, modify, and distribute.
