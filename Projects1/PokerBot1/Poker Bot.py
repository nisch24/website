"""
=============================================================================
  TEXAS HOLD'EM POKER BOT WITH GUI
=============================================================================
  A fully playable Texas Hold'em poker game against an AI bot.
  Built with Python's standard library only (tkinter for GUI).

  HOW IT WORKS:
  -------------
  1. CARDS & DECK: Standard 52-card deck with suits and ranks.
  2. HAND EVALUATOR: Checks all combinations of 5 cards from 7
     (2 hole cards + 5 community cards) to find the best hand.
  3. BOT AI: Uses hand strength, pot odds, and position to decide
     whether to fold, call, or raise. Includes occasional bluffs.
  4. GUI: Canvas-based poker table with card graphics, chip counts,
     action buttons, and a game log.

  NO external dependencies required — just run with Python 3.
=============================================================================
"""

import tkinter as tk
from tkinter import ttk, messagebox
import random
from collections import Counter
from enum import IntEnum
from itertools import combinations

# =============================================================================
#  CONSTANTS & CARD REPRESENTATION
# =============================================================================

SUITS = ['♠', '♥', '♦', '♣']
SUIT_COLORS = {'♠': '#1a1a2e', '♥': '#e63946', '♦': '#e63946', '♣': '#1a1a2e'}
RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
RANK_VALUES = {r: i for i, r in enumerate(RANKS, 2)}  # 2=2, 3=3, ..., A=14


class HandRank(IntEnum):
    """
    Poker hand rankings from lowest to highest.
    Each hand type is assigned an integer so we can compare hands easily.
    Higher number = better hand.
    """
    HIGH_CARD = 0
    ONE_PAIR = 1
    TWO_PAIR = 2
    THREE_OF_A_KIND = 3
    STRAIGHT = 4
    FLUSH = 5
    FULL_HOUSE = 6
    FOUR_OF_A_KIND = 7
    STRAIGHT_FLUSH = 8
    ROYAL_FLUSH = 9


HAND_NAMES = {
    HandRank.HIGH_CARD: "High Card",
    HandRank.ONE_PAIR: "One Pair",
    HandRank.TWO_PAIR: "Two Pair",
    HandRank.THREE_OF_A_KIND: "Three of a Kind",
    HandRank.STRAIGHT: "Straight",
    HandRank.FLUSH: "Flush",
    HandRank.FULL_HOUSE: "Full House",
    HandRank.FOUR_OF_A_KIND: "Four of a Kind",
    HandRank.STRAIGHT_FLUSH: "Straight Flush",
    HandRank.ROYAL_FLUSH: "Royal Flush",
}


class Card:
    """
    Represents a single playing card with a rank and suit.
    Example: Card('A', '♠') = Ace of Spades
    """
    def __init__(self, rank, suit):
        self.rank = rank
        self.suit = suit
        self.value = RANK_VALUES[rank]  # Numeric value for comparisons

    def __repr__(self):
        return f"{self.rank}{self.suit}"

    def __eq__(self, other):
        return self.rank == other.rank and self.suit == other.suit

    def __hash__(self):
        return hash((self.rank, self.suit))


class Deck:
    """
    A standard 52-card deck.
    - shuffle(): Randomizes card order using Python's random module.
    - deal(): Removes and returns the top card.
    """
    def __init__(self):
        self.cards = [Card(r, s) for s in SUITS for r in RANKS]
        self.shuffle()

    def shuffle(self):
        random.shuffle(self.cards)

    def deal(self):
        return self.cards.pop()


# =============================================================================
#  HAND EVALUATOR
# =============================================================================
class HandEvaluator:
    """
    Evaluates poker hands. The key method is evaluate(), which takes
    any number of cards (typically 7: 2 hole + 5 community) and returns
    the best possible 5-card hand ranking.

    HOW IT WORKS:
    1. Generate all possible 5-card combinations from the available cards.
    2. Score each combination using _score_hand().
    3. Return the highest-scoring combination.

    SCORING:
    A hand score is a tuple: (HandRank, *tiebreakers)
    - HandRank is the type (pair, flush, etc.)
    - Tiebreakers are rank values used to break ties between same-type hands.
    Example: Two players both have a pair — the higher pair wins.
    """

    @staticmethod
    def evaluate(cards):
        """
        Find the best 5-card hand from a list of cards.
        Returns: (HandRank, hand_name, best_5_cards, score_tuple)
        """
        best_score = (-1,)
        best_hand = None

        # Try every possible 5-card combination
        for combo in combinations(cards, 5):
            score = HandEvaluator._score_hand(list(combo))
            if score > best_score:
                best_score = score
                best_hand = list(combo)

        hand_rank = HandRank(best_score[0])
        return hand_rank, HAND_NAMES[hand_rank], best_hand, best_score

    @staticmethod
    def _score_hand(cards):
        """
        Score a 5-card hand. Returns a tuple for comparison.

        ALGORITHM:
        1. Count how many of each rank appear (pairs, trips, etc.)
        2. Check for flush (all same suit)
        3. Check for straight (5 consecutive ranks)
        4. Combine these to determine the hand type
        5. Add tiebreaker values
        """
        ranks = sorted([c.value for c in cards], reverse=True)
        suits = [c.suit for c in cards]
        rank_counts = Counter(ranks)

        # Sort by frequency first, then by rank value (for tiebreaking)
        count_groups = sorted(rank_counts.items(), key=lambda x: (x[1], x[0]), reverse=True)
        counts = [c for _, c in count_groups]
        count_ranks = [r for r, _ in count_groups]

        is_flush = len(set(suits)) == 1
        is_straight = HandEvaluator._is_straight(ranks)

        # Special case: A-2-3-4-5 straight (wheel)
        is_wheel = set(ranks) == {14, 2, 3, 4, 5}

        # --- Determine hand rank ---
        if is_flush and is_straight:
            if min(ranks) == 10:
                return (HandRank.ROYAL_FLUSH, *ranks)
            if is_wheel:
                return (HandRank.STRAIGHT_FLUSH, 5, 4, 3, 2, 1)
            return (HandRank.STRAIGHT_FLUSH, *ranks)

        if counts == [4, 1]:
            return (HandRank.FOUR_OF_A_KIND, *count_ranks)

        if counts == [3, 2]:
            return (HandRank.FULL_HOUSE, *count_ranks)

        if is_flush:
            return (HandRank.FLUSH, *ranks)

        if is_straight:
            if is_wheel:
                return (HandRank.STRAIGHT, 5, 4, 3, 2, 1)
            return (HandRank.STRAIGHT, *ranks)

        if counts == [3, 1, 1]:
            return (HandRank.THREE_OF_A_KIND, *count_ranks)

        if counts == [2, 2, 1]:
            return (HandRank.TWO_PAIR, *count_ranks)

        if counts == [2, 1, 1, 1]:
            return (HandRank.ONE_PAIR, *count_ranks)

        return (HandRank.HIGH_CARD, *ranks)

    @staticmethod
    def _is_straight(ranks):
        """Check if 5 sorted ranks form a straight (consecutive sequence)."""
        unique = sorted(set(ranks))
        if len(unique) != 5:
            return False
        # Normal straight: highest - lowest == 4
        if unique[-1] - unique[0] == 4:
            return True
        # Wheel (A-2-3-4-5): Ace wraps around
        if set(unique) == {14, 2, 3, 4, 5}:
            return True
        return False


# =============================================================================
#  BOT AI
# =============================================================================
class BotAI:
    """
    The AI opponent. Makes decisions based on:
    1. PRE-FLOP: Starting hand strength (premium pairs, suited connectors, etc.)
    2. POST-FLOP: Current hand rank against the board
    3. POT ODDS: Compares bet-to-call vs pot size
    4. BLUFFING: ~15% chance to play aggressively with weak hands

    STRATEGY OVERVIEW:
    - The bot categorizes its hand strength into tiers (0.0 to 1.0).
    - It then decides an action based on strength + pot odds + randomness.
    - This creates a bot that plays reasonably but isn't perfectly optimal,
      making for a fun and challenging opponent.
    """

    def __init__(self, name="Bot"):
        self.name = name
        self.bluff_frequency = 0.15  # 15% bluff rate

    def decide(self, hole_cards, community_cards, pot, current_bet,
               my_bet, my_chips, phase):
        """
        Main decision method. Returns: ('fold'|'call'|'raise', amount)

        PARAMETERS:
        - hole_cards: Bot's 2 private cards
        - community_cards: Shared cards on the table (0-5)
        - pot: Total chips in the pot
        - current_bet: The current bet to match
        - my_bet: How much the bot has already bet this round
        - my_chips: Bot's remaining chip stack
        - phase: Current game phase ('preflop','flop','turn','river')
        """
        to_call = current_bet - my_bet  # How much more to put in

        # Calculate hand strength (0.0 = trash, 1.0 = nuts)
        if phase == 'preflop':
            strength = self._preflop_strength(hole_cards)
        else:
            strength = self._postflop_strength(hole_cards, community_cards)

        # Bluff chance: occasionally play weak hands strong
        is_bluffing = random.random() < self.bluff_frequency

        # --- Decision Logic ---
        if to_call == 0:
            # No bet to call — we can check for free
            if strength > 0.7 or (is_bluffing and strength > 0.3):
                raise_amt = self._calc_raise(strength, pot, my_chips, current_bet)
                if raise_amt > 0:
                    return ('raise', raise_amt)
            return ('call', 0)  # Check

        # There's a bet to call
        pot_odds = to_call / (pot + to_call) if (pot + to_call) > 0 else 0

        if strength > 0.8:
            # Very strong hand — raise!
            raise_amt = self._calc_raise(strength, pot, my_chips, current_bet)
            if raise_amt > 0:
                return ('raise', raise_amt)
            return ('call', to_call)
        elif strength > 0.5:
            # Decent hand — call, maybe raise
            if strength > pot_odds + 0.1:
                if random.random() < 0.3:
                    raise_amt = self._calc_raise(strength, pot, my_chips, current_bet)
                    if raise_amt > 0:
                        return ('raise', raise_amt)
                return ('call', to_call)
            return ('call', to_call)
        elif strength > 0.3:
            # Marginal hand — call if pot odds are good
            if strength > pot_odds:
                return ('call', to_call)
            if is_bluffing:
                raise_amt = self._calc_raise(0.6, pot, my_chips, current_bet)
                if raise_amt > 0:
                    return ('raise', raise_amt)
            return ('fold', 0)
        else:
            # Weak hand — usually fold
            if is_bluffing and random.random() < 0.5:
                raise_amt = self._calc_raise(0.5, pot, my_chips, current_bet)
                if raise_amt > 0:
                    return ('raise', raise_amt)
            if to_call <= my_chips * 0.05:
                return ('call', to_call)
            return ('fold', 0)

    def _preflop_strength(self, hole_cards):
        """
        Evaluate starting hand strength before any community cards.

        CATEGORIES:
        - Premium pairs (AA, KK, QQ): 0.95
        - High pairs (JJ, 10-10): 0.85
        - Medium pairs: 0.65
        - Big suited connectors (AKs, AQs): 0.80
        - Big offsuit (AK, AQ): 0.70
        - Suited connectors: 0.50
        - Other playable hands: 0.35
        - Junk: 0.15
        """
        c1, c2 = hole_cards
        v1, v2 = max(c1.value, c2.value), min(c1.value, c2.value)
        is_pair = v1 == v2
        is_suited = c1.suit == c2.suit
        gap = v1 - v2

        if is_pair:
            if v1 >= 12:    return 0.95  # QQ+
            if v1 >= 10:    return 0.85  # JJ, TT
            if v1 >= 7:     return 0.65  # 77-99
            return 0.50                   # 22-66

        if v1 == 14:  # Ace-high
            if v2 >= 12:
                return 0.80 if is_suited else 0.70  # AK, AQ
            if v2 >= 10:
                return 0.65 if is_suited else 0.55  # AJ, AT
            if is_suited:
                return 0.50  # Axs
            return 0.35

        if is_suited and gap <= 2 and v2 >= 8:
            return 0.55  # Suited connectors (T9s, J9s, etc.)

        if v1 >= 11 and v2 >= 10:
            return 0.50 if is_suited else 0.40  # KQ, KJ, QJ

        if is_suited and gap <= 3:
            return 0.40  # Suited one-gappers

        if v1 >= 10 and v2 >= 8:
            return 0.35  # Connected broadways

        return 0.15  # Junk hands

    def _postflop_strength(self, hole_cards, community_cards):
        """
        Evaluate hand strength after community cards are dealt.

        Uses the actual hand evaluator to see what we've made,
        then maps the hand rank to a strength score.
        Also considers draw potential (flush/straight draws).
        """
        all_cards = list(hole_cards) + list(community_cards)
        hand_rank, _, _, _ = HandEvaluator.evaluate(all_cards)

        # Base strength from made hand
        strength_map = {
            HandRank.HIGH_CARD: 0.15,
            HandRank.ONE_PAIR: 0.40,
            HandRank.TWO_PAIR: 0.60,
            HandRank.THREE_OF_A_KIND: 0.75,
            HandRank.STRAIGHT: 0.82,
            HandRank.FLUSH: 0.85,
            HandRank.FULL_HOUSE: 0.92,
            HandRank.FOUR_OF_A_KIND: 0.97,
            HandRank.STRAIGHT_FLUSH: 0.99,
            HandRank.ROYAL_FLUSH: 1.0,
        }
        strength = strength_map.get(hand_rank, 0.15)

        # Boost for pair using hole card(s) vs. board pair
        if hand_rank == HandRank.ONE_PAIR:
            hole_values = {c.value for c in hole_cards}
            comm_values = [c.value for c in community_cards]
            comm_counts = Counter(comm_values)
            # Check if our hole card makes the pair (not just a board pair)
            for v in hole_values:
                if comm_counts.get(v, 0) >= 1:
                    # Pair using hole card — better
                    if v >= 12:
                        strength = 0.55  # Top pair
                    elif v >= 9:
                        strength = 0.48  # Middle pair
                    break

        # Draw potential: flush draw or straight draw adds value
        if len(community_cards) < 5:
            suits_in_hand = [c.suit for c in all_cards]
            suit_counts = Counter(suits_in_hand)
            if max(suit_counts.values()) == 4:
                strength += 0.12  # Flush draw

            values = sorted(set(c.value for c in all_cards))
            for i in range(len(values) - 3):
                if values[i+3] - values[i] <= 4:
                    strength += 0.08  # Open-ended straight draw
                    break

        return min(strength, 1.0)

    def _calc_raise(self, strength, pot, my_chips, current_bet):
        """
        Calculate raise amount based on hand strength and pot size.

        STRATEGY:
        - Stronger hands → larger raises (50-100% of pot)
        - Weaker hands (bluffs) → smaller raises (30-50% of pot)
        - Never raise more than our stack
        - Minimum raise is 2x the current bet
        """
        if my_chips <= 0:
            return 0

        # Raise proportional to pot and strength
        raise_fraction = 0.3 + (strength * 0.7)  # 30%-100% pot
        raise_amount = int(pot * raise_fraction)

        # Ensure minimum raise
        min_raise = max(current_bet * 2, 20)
        raise_amount = max(raise_amount, min_raise)

        # Cap at our chip stack
        raise_amount = min(raise_amount, my_chips)

        return raise_amount


# =============================================================================
#  GAME ENGINE
# =============================================================================
class PokerGame:
    """
    Manages the complete game state for heads-up Texas Hold'em.

    GAME FLOW:
    1. Post blinds (small blind = 10, big blind = 20)
    2. Deal 2 hole cards to each player
    3. Pre-flop betting round
    4. Deal 3 community cards (the Flop)
    5. Flop betting round
    6. Deal 1 community card (the Turn)
    7. Turn betting round
    8. Deal 1 community card (the River)
    9. River betting round
    10. Showdown — best hand wins the pot

    The dealer position alternates each hand. In heads-up play,
    the dealer posts the small blind and acts first pre-flop,
    but acts last on all subsequent rounds.
    """

    SMALL_BLIND = 10
    BIG_BLIND = 20
    STARTING_CHIPS = 1000

    def __init__(self):
        self.player_chips = self.STARTING_CHIPS
        self.bot_chips = self.STARTING_CHIPS
        self.pot = 0
        self.player_bet = 0
        self.bot_bet = 0
        self.community_cards = []
        self.player_hand = []
        self.bot_hand = []
        self.deck = None
        self.phase = 'preflop'
        self.dealer_is_player = True  # Alternates each hand
        self.hand_over = False
        self.bot_ai = BotAI("Bot")
        self.log_messages = []
        self.current_bet = 0
        self.last_raiser = None
        self.winner_info = None

    def new_hand(self):
        """Start a new hand: shuffle, deal, post blinds."""
        self.deck = Deck()
        self.community_cards = []
        self.pot = 0
        self.player_bet = 0
        self.bot_bet = 0
        self.phase = 'preflop'
        self.hand_over = False
        self.current_bet = 0
        self.last_raiser = None
        self.winner_info = None
        self.log_messages = []

        # Alternate dealer
        self.dealer_is_player = not self.dealer_is_player

        # Deal hole cards
        self.player_hand = [self.deck.deal(), self.deck.deal()]
        self.bot_hand = [self.deck.deal(), self.deck.deal()]

        self._log(f"--- New Hand ---")
        self._log(f"Your chips: {self.player_chips} | Bot chips: {self.bot_chips}")
        dealer_name = "You" if self.dealer_is_player else "Bot"
        self._log(f"Dealer: {dealer_name}")

        # Post blinds
        # In heads-up: dealer posts small blind, other posts big blind
        if self.dealer_is_player:
            sb_amount = min(self.SMALL_BLIND, self.player_chips)
            bb_amount = min(self.BIG_BLIND, self.bot_chips)
            self.player_chips -= sb_amount
            self.player_bet = sb_amount
            self.bot_chips -= bb_amount
            self.bot_bet = bb_amount
            self._log(f"You post small blind: {sb_amount}")
            self._log(f"Bot posts big blind: {bb_amount}")
        else:
            sb_amount = min(self.SMALL_BLIND, self.bot_chips)
            bb_amount = min(self.BIG_BLIND, self.player_chips)
            self.bot_chips -= sb_amount
            self.bot_bet = sb_amount
            self.player_chips -= bb_amount
            self.player_bet = bb_amount
            self._log(f"Bot posts small blind: {sb_amount}")
            self._log(f"You post big blind: {bb_amount}")

        self.pot = self.player_bet + self.bot_bet
        self.current_bet = max(self.player_bet, self.bot_bet)

        self._log(f"Your hand: {self.player_hand[0]} {self.player_hand[1]}")

        # In heads-up preflop: dealer (SB) acts first
        if self.dealer_is_player:
            return 'player_turn'
        else:
            return 'bot_turn'

    def player_action(self, action, raise_amount=0):
        """
        Process the player's action.
        action: 'fold', 'call', or 'raise'
        raise_amount: total bet amount when raising
        """
        if self.hand_over:
            return 'hand_over'

        to_call = self.current_bet - self.player_bet

        if action == 'fold':
            self._log("You fold.")
            self.bot_chips += self.pot
            self.winner_info = ("Bot", "You folded", None)
            self._log(f"Bot wins pot of {self.pot}!")
            self.hand_over = True
            return 'hand_over'

        elif action == 'call':
            call_amount = min(to_call, self.player_chips)
            self.player_chips -= call_amount
            self.player_bet += call_amount
            self.pot += call_amount
            if to_call > 0:
                self._log(f"You call {call_amount}.")
            else:
                self._log("You check.")

        elif action == 'raise':
            total_bet = raise_amount
            additional = total_bet - self.player_bet
            additional = min(additional, self.player_chips)
            self.player_chips -= additional
            self.player_bet += additional
            self.pot += additional
            self.current_bet = self.player_bet
            self.last_raiser = 'player'
            self._log(f"You raise to {self.player_bet}.")

        # Check if we should move to next phase or if bot needs to act
        if action == 'raise':
            return 'bot_turn'  # Bot needs to respond to raise

        # If player just called/checked, check if round is complete
        if self.last_raiser == 'player':
            # Bot already matched — move to next phase
            return self._next_phase()
        elif self.last_raiser == 'bot':
            # Player called bot's raise — move to next phase
            return self._next_phase()
        elif self.last_raiser is None:
            # No one has raised yet
            if self.phase == 'preflop':
                # Pre-flop special: BB gets option to raise
                if not self.dealer_is_player and to_call == 0:
                    # Player is BB and checked — move to flop
                    return self._next_phase()
                else:
                    return 'bot_turn'
            else:
                # Post-flop: if player is first to act and checks
                if self._player_acts_first_postflop():
                    return 'bot_turn'
                else:
                    return self._next_phase()

        return self._next_phase()

    def bot_action(self):
        """Let the bot AI make its decision."""
        if self.hand_over:
            return 'hand_over'

        action, amount = self.bot_ai.decide(
            self.bot_hand, self.community_cards,
            self.pot, self.current_bet, self.bot_bet,
            self.bot_chips, self.phase
        )

        to_call = self.current_bet - self.bot_bet

        if action == 'fold':
            self._log("Bot folds.")
            self.player_chips += self.pot
            self.winner_info = ("Player", "Bot folded", None)
            self._log(f"You win pot of {self.pot}!")
            self.hand_over = True
            return 'hand_over'

        elif action == 'call':
            call_amount = min(to_call, self.bot_chips)
            self.bot_chips -= call_amount
            self.bot_bet += call_amount
            self.pot += call_amount
            if to_call > 0:
                self._log(f"Bot calls {call_amount}.")
            else:
                self._log("Bot checks.")

        elif action == 'raise':
            total_raise = amount
            additional = total_raise - self.bot_bet
            additional = min(additional, self.bot_chips)
            self.bot_chips -= additional
            self.bot_bet += additional
            self.pot += additional
            self.current_bet = self.bot_bet
            self.last_raiser = 'bot'
            self._log(f"Bot raises to {self.bot_bet}.")
            return 'player_turn'

        # Bot called/checked — determine what happens next
        if action == 'call':
            if self.last_raiser == 'bot':
                return self._next_phase()
            elif self.last_raiser == 'player':
                return self._next_phase()
            elif self.last_raiser is None:
                if self.phase == 'preflop':
                    if self.dealer_is_player:
                        # Bot is BB, checked preflop — flop
                        if to_call == 0:
                            return self._next_phase()
                        return 'player_turn'
                    else:
                        return 'player_turn'
                else:
                    if self._player_acts_first_postflop():
                        return self._next_phase()
                    else:
                        return 'player_turn'

        return self._next_phase()

    def _player_acts_first_postflop(self):
        """In heads-up, non-dealer acts first post-flop."""
        return not self.dealer_is_player

    def _next_phase(self):
        """Advance to the next phase of the hand."""
        self.player_bet = 0
        self.bot_bet = 0
        self.current_bet = 0
        self.last_raiser = None

        if self.phase == 'preflop':
            self.phase = 'flop'
            self.community_cards = [self.deck.deal() for _ in range(3)]
            cc = ' '.join(str(c) for c in self.community_cards)
            self._log(f"--- Flop: {cc} ---")
        elif self.phase == 'flop':
            self.phase = 'turn'
            self.community_cards.append(self.deck.deal())
            self._log(f"--- Turn: {self.community_cards[-1]} ---")
        elif self.phase == 'turn':
            self.phase = 'river'
            self.community_cards.append(self.deck.deal())
            self._log(f"--- River: {self.community_cards[-1]} ---")
        elif self.phase == 'river':
            return self._showdown()

        # Determine who acts first post-flop
        if self._player_acts_first_postflop():
            return 'player_turn'
        else:
            return 'bot_turn'

    def _showdown(self):
        """Compare hands and determine the winner."""
        self._log("--- Showdown ---")
        self._log(f"Bot's hand: {self.bot_hand[0]} {self.bot_hand[1]}")

        p_rank, p_name, p_best, p_score = HandEvaluator.evaluate(
            self.player_hand + self.community_cards)
        b_rank, b_name, b_best, b_score = HandEvaluator.evaluate(
            self.bot_hand + self.community_cards)

        self._log(f"Your best hand: {p_name}")
        self._log(f"Bot's best hand: {b_name}")

        if p_score > b_score:
            self.player_chips += self.pot
            self.winner_info = ("Player", p_name, self.player_hand)
            self._log(f"You win {self.pot} with {p_name}!")
        elif b_score > p_score:
            self.bot_chips += self.pot
            self.winner_info = ("Bot", b_name, self.bot_hand)
            self._log(f"Bot wins {self.pot} with {b_name}!")
        else:
            half = self.pot // 2
            self.player_chips += half
            self.bot_chips += self.pot - half
            self.winner_info = ("Tie", p_name, None)
            self._log(f"Split pot! Both have {p_name}.")

        self.hand_over = True
        return 'hand_over'

    def _log(self, msg):
        self.log_messages.append(msg)

    def get_player_actions(self):
        """Return which actions are available to the player."""
        to_call = self.current_bet - self.player_bet
        actions = ['fold']
        if to_call == 0:
            actions.append('check')
        else:
            actions.append('call')
        if self.player_chips > to_call:
            actions.append('raise')
        return actions, to_call


# =============================================================================
#  GUI
# =============================================================================
class PokerGUI:
    """
    The graphical user interface for the poker game.

    LAYOUT:
    ┌──────────────────────────────────────┐
    │  Bot info (chips, cards face-down)   │
    │                                      │
    │       Community Cards (center)       │
    │           Pot Display                │
    │                                      │
    │  Player info (chips, cards face-up)  │
    │                                      │
    │  [Fold] [Check/Call] [Raise] [Slider]│
    │                                      │
    │  Game Log (scrollable text)          │
    └──────────────────────────────────────┘
    """

    # Card dimensions
    CARD_W = 60
    CARD_H = 85
    CARD_RADIUS = 8

    # Colors
    TABLE_COLOR = '#1b5e20'
    TABLE_FELT = '#2e7d32'
    BG_COLOR = '#0d1117'
    CARD_BG = '#ffffff'
    CARD_BACK = '#1565c0'
    TEXT_COLOR = '#e0e0e0'
    GOLD = '#ffd700'
    ACCENT = '#4fc3f7'

    def __init__(self, root):
        self.root = root
        self.root.title("♠ Texas Hold'em Poker ♠")
        self.root.configure(bg=self.BG_COLOR)
        self.root.resizable(False, False)

        self.game = PokerGame()
        self.waiting_for_player = False
        self.log_index = 0  # Track displayed log messages

        self._create_widgets()
        self._start_new_hand()

    def _create_widgets(self):
        """Build all GUI elements."""
        # Main frame
        main_frame = tk.Frame(self.root, bg=self.BG_COLOR, padx=15, pady=10)
        main_frame.pack(fill='both', expand=True)

        # Title
        title = tk.Label(main_frame, text="♠ ♥ Texas Hold'em ♦ ♣",
                         font=('Segoe UI', 20, 'bold'), fg=self.GOLD,
                         bg=self.BG_COLOR)
        title.pack(pady=(0, 8))

        # Canvas for the table
        self.canvas = tk.Canvas(main_frame, width=700, height=420,
                                bg=self.TABLE_COLOR, highlightthickness=2,
                                highlightbackground='#2c2c2c')
        self.canvas.pack(pady=5)

        # Draw table felt (rounded rectangle)
        self._draw_table()

        # Controls frame
        ctrl_frame = tk.Frame(main_frame, bg=self.BG_COLOR)
        ctrl_frame.pack(fill='x', pady=8)

        btn_style = {'font': ('Segoe UI', 11, 'bold'), 'width': 10,
                     'relief': 'flat', 'cursor': 'hand2', 'bd': 0}

        self.fold_btn = tk.Button(ctrl_frame, text="Fold",
                                  bg='#c62828', fg='white',
                                  activebackground='#e53935',
                                  command=self._on_fold, **btn_style)
        self.fold_btn.pack(side='left', padx=5)

        self.call_btn = tk.Button(ctrl_frame, text="Check",
                                  bg='#1565c0', fg='white',
                                  activebackground='#1e88e5',
                                  command=self._on_call, **btn_style)
        self.call_btn.pack(side='left', padx=5)

        self.raise_btn = tk.Button(ctrl_frame, text="Raise",
                                   bg='#2e7d32', fg='white',
                                   activebackground='#43a047',
                                   command=self._on_raise, **btn_style)
        self.raise_btn.pack(side='left', padx=5)

        # Raise slider
        slider_frame = tk.Frame(ctrl_frame, bg=self.BG_COLOR)
        slider_frame.pack(side='left', padx=15, fill='x', expand=True)

        self.raise_label = tk.Label(slider_frame, text="Raise: 40",
                                    font=('Segoe UI', 10), fg=self.ACCENT,
                                    bg=self.BG_COLOR)
        self.raise_label.pack()

        self.raise_slider = tk.Scale(slider_frame, from_=40, to=1000,
                                     orient='horizontal', bg=self.BG_COLOR,
                                     fg=self.TEXT_COLOR, troughcolor='#333',
                                     highlightthickness=0, showvalue=False,
                                     command=self._on_slider_change)
        self.raise_slider.pack(fill='x')

        # New Hand button
        self.new_hand_btn = tk.Button(ctrl_frame, text="New Hand",
                                      bg='#6a1b9a', fg='white',
                                      activebackground='#8e24aa',
                                      command=self._start_new_hand,
                                      **btn_style)
        self.new_hand_btn.pack(side='right', padx=5)

        # Game log
        log_frame = tk.Frame(main_frame, bg=self.BG_COLOR)
        log_frame.pack(fill='both', expand=True, pady=5)

        self.log_text = tk.Text(log_frame, height=8, width=80,
                                bg='#161b22', fg='#c9d1d9',
                                font=('Consolas', 9),
                                relief='flat', padx=10, pady=5,
                                state='disabled', wrap='word')
        scrollbar = tk.Scrollbar(log_frame, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=scrollbar.set)
        scrollbar.pack(side='right', fill='y')
        self.log_text.pack(side='left', fill='both', expand=True)

    def _draw_table(self):
        """Draw the poker table felt."""
        # Outer border
        self._round_rect(self.canvas, 20, 15, 680, 405, 40,
                         fill=self.TABLE_FELT, outline='#1b5e20', width=3)
        # Inner border
        self._round_rect(self.canvas, 35, 30, 665, 390, 35,
                         fill=self.TABLE_COLOR, outline='#388e3c', width=2)

    def _round_rect(self, canvas, x1, y1, x2, y2, radius, **kwargs):
        """Draw a rounded rectangle on the canvas."""
        points = [
            x1+radius, y1, x2-radius, y1,
            x2, y1, x2, y1+radius,
            x2, y2-radius, x2, y2,
            x2-radius, y2, x1+radius, y2,
            x1, y2, x1, y2-radius,
            x1, y1+radius, x1, y1,
        ]
        return canvas.create_polygon(points, smooth=True, **kwargs)

    def _draw_card(self, x, y, card=None, face_up=True):
        """
        Draw a playing card at (x, y).
        If face_up=True, show rank and suit. Otherwise show card back.
        """
        w, h, r = self.CARD_W, self.CARD_H, self.CARD_RADIUS

        if face_up and card:
            # Card face - white background
            self._round_rect(self.canvas, x, y, x+w, y+h, r,
                             fill=self.CARD_BG, outline='#ccc', width=1)
            color = SUIT_COLORS[card.suit]
            # Rank top-left
            self.canvas.create_text(x+10, y+14, text=card.rank,
                                    font=('Segoe UI', 12, 'bold'),
                                    fill=color, anchor='center')
            # Suit center
            self.canvas.create_text(x + w//2, y + h//2, text=card.suit,
                                    font=('Segoe UI', 22), fill=color,
                                    anchor='center')
            # Rank bottom-right
            self.canvas.create_text(x+w-10, y+h-14, text=card.rank,
                                    font=('Segoe UI', 12, 'bold'),
                                    fill=color, anchor='center')
        else:
            # Card back - blue pattern
            self._round_rect(self.canvas, x, y, x+w, y+h, r,
                             fill=self.CARD_BACK, outline='#0d47a1', width=2)
            # Diamond pattern on back
            cx, cy = x + w//2, y + h//2
            self.canvas.create_text(cx, cy, text="♦",
                                    font=('Segoe UI', 16), fill='#90caf9',
                                    anchor='center')
            self._round_rect(self.canvas, x+6, y+6, x+w-6, y+h-6, r-2,
                             fill='', outline='#64b5f6', width=1)

    def _update_display(self):
        """Redraw the entire table state."""
        self.canvas.delete('all')
        self._draw_table()

        # --- Bot area (top) ---
        self.canvas.create_text(350, 38, text=f"🤖 Bot — Chips: {self.game.bot_chips}",
                                font=('Segoe UI', 12, 'bold'), fill=self.GOLD)

        # Bot's cards
        show_bot = self.game.hand_over and self.game.winner_info
        if self.game.bot_hand:
            x_start = 310
            for i, card in enumerate(self.game.bot_hand):
                self._draw_card(x_start + i * 70, 52,
                                card=card, face_up=show_bot)

        # Bot bet indicator
        if self.game.bot_bet > 0:
            self.canvas.create_text(350, 150,
                                    text=f"Bet: {self.game.bot_bet}",
                                    font=('Segoe UI', 10, 'bold'),
                                    fill='#ffcc02')

        # --- Community cards (center) ---
        if self.game.community_cards:
            total_w = len(self.game.community_cards) * 70 - 10
            x_start = 350 - total_w // 2
            for i, card in enumerate(self.game.community_cards):
                self._draw_card(x_start + i * 70, 175, card=card, face_up=True)

        # Pot display
        pot_y = 270
        self.canvas.create_text(350, pot_y, text=f"💰 Pot: {self.game.pot}",
                                font=('Segoe UI', 13, 'bold'), fill=self.GOLD)

        # Phase indicator
        phase_text = self.game.phase.upper()
        self.canvas.create_text(350, pot_y + 20, text=phase_text,
                                font=('Segoe UI', 9), fill='#a5d6a7')

        # Winner banner
        if self.game.winner_info:
            winner, reason, _ = self.game.winner_info
            if winner == "Player":
                banner = f"🏆 You Win! — {reason}"
                color = '#4caf50'
            elif winner == "Bot":
                banner = f"Bot Wins — {reason}"
                color = '#f44336'
            else:
                banner = f"Tie! — {reason}"
                color = '#ffb74d'
            self.canvas.create_text(350, pot_y + 42, text=banner,
                                    font=('Segoe UI', 12, 'bold'), fill=color)

        # --- Player area (bottom) ---
        # Player bet indicator
        if self.game.player_bet > 0:
            self.canvas.create_text(350, 308,
                                    text=f"Bet: {self.game.player_bet}",
                                    font=('Segoe UI', 10, 'bold'),
                                    fill='#ffcc02')

        # Player's cards
        if self.game.player_hand:
            x_start = 310
            for i, card in enumerate(self.game.player_hand):
                self._draw_card(x_start + i * 70, 320,
                                card=card, face_up=True)

        self.canvas.create_text(350, 400,
                                text=f"👤 You — Chips: {self.game.player_chips}",
                                font=('Segoe UI', 12, 'bold'), fill=self.ACCENT)

        # Update controls
        self._update_controls()

        # Update log
        self._update_log()

    def _update_controls(self):
        """Enable/disable buttons based on game state."""
        if self.game.hand_over or not self.waiting_for_player:
            self.fold_btn.config(state='disabled')
            self.call_btn.config(state='disabled')
            self.raise_btn.config(state='disabled')
            self.raise_slider.config(state='disabled')
            self.new_hand_btn.config(state='normal')
            return

        actions, to_call = self.game.get_player_actions()

        self.fold_btn.config(state='normal' if 'fold' in actions else 'disabled')

        if 'check' in actions:
            self.call_btn.config(text='Check', state='normal')
        elif 'call' in actions:
            self.call_btn.config(text=f'Call {to_call}', state='normal')
        else:
            self.call_btn.config(state='disabled')

        if 'raise' in actions:
            self.raise_btn.config(state='normal')
            self.raise_slider.config(state='normal')
            min_raise = max(self.game.current_bet * 2, self.game.BIG_BLIND)
            max_raise = self.game.player_chips + self.game.player_bet
            self.raise_slider.config(from_=min(min_raise, max_raise),
                                     to=max_raise)
            self.raise_slider.set(min(min_raise, max_raise))
        else:
            self.raise_btn.config(state='disabled')
            self.raise_slider.config(state='disabled')

    def _update_log(self):
        """Append new log messages to the text widget."""
        messages = self.game.log_messages[self.log_index:]
        if messages:
            self.log_text.config(state='normal')
            for msg in messages:
                self.log_text.insert('end', msg + '\n')
            self.log_text.see('end')
            self.log_text.config(state='disabled')
            self.log_index = len(self.game.log_messages)

    def _on_slider_change(self, val):
        self.raise_label.config(text=f"Raise: {int(float(val))}")

    def _on_fold(self):
        if not self.waiting_for_player:
            return
        self.waiting_for_player = False
        result = self.game.player_action('fold')
        self._update_display()
        self._process_result(result)

    def _on_call(self):
        if not self.waiting_for_player:
            return
        self.waiting_for_player = False
        result = self.game.player_action('call')
        self._update_display()
        self._process_result(result)

    def _on_raise(self):
        if not self.waiting_for_player:
            return
        self.waiting_for_player = False
        raise_to = int(self.raise_slider.get())
        result = self.game.player_action('raise', raise_to)
        self._update_display()
        self._process_result(result)

    def _process_result(self, result):
        """Handle the result of an action (whose turn is next)."""
        if result == 'hand_over':
            self._update_display()
            self._check_game_over()
        elif result == 'bot_turn':
            # Delay bot action slightly for realism
            self.root.after(700, self._do_bot_turn)
        elif result == 'player_turn':
            self.waiting_for_player = True
            self._update_display()

    def _do_bot_turn(self):
        """Execute the bot's turn with a small delay for UX."""
        result = self.game.bot_action()
        self._update_display()
        self._process_result(result)

    def _start_new_hand(self):
        """Deal a new hand."""
        # Check if either player is broke
        if self.game.player_chips <= 0 or self.game.bot_chips <= 0:
            self._new_game()
            return

        self.log_index = 0
        self.log_text.config(state='normal')
        self.log_text.delete('1.0', 'end')
        self.log_text.config(state='disabled')

        result = self.game.new_hand()
        self._update_display()
        self._process_result(result)

    def _check_game_over(self):
        """Check if the game is over (someone is out of chips)."""
        if self.game.player_chips <= 0:
            self.game._log("*** GAME OVER — You're out of chips! ***")
            self._update_display()
        elif self.game.bot_chips <= 0:
            self.game._log("*** GAME OVER — Bot is out of chips! You win! ***")
            self._update_display()

    def _new_game(self):
        """Reset the entire game."""
        self.game = PokerGame()
        self.log_index = 0
        self.log_text.config(state='normal')
        self.log_text.delete('1.0', 'end')
        self.log_text.config(state='disabled')
        self._start_new_hand()


# =============================================================================
#  MAIN ENTRY POINT
# =============================================================================
if __name__ == '__main__':
    root = tk.Tk()
    root.geometry('730x720')
    app = PokerGUI(root)
    root.mainloop()
