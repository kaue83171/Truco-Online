export type Suit = "espadas" | "ouro" | "calice" | "paus";

export type CardValue =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "10"
  | "11"
  | "12";

export type RoomStatus =
  | "lobby"
  | "betting"
  | "playing"
  | "round_result"
  | "finished";

export type TrickPhase = "idle" | "playing" | "result";
export type StartingLives = 3 | 5;
export type GameMode = "fodinha" | "truco-gaucho";
export type TrucoTeam = "A" | "B";
export type TrucoCall = "none" | "envido" | "flor" | "truco" | "retruco" | "vale-quatro";
export type TrucoPhase = "waiting" | "dealing" | "playing" | "call" | "hand-result" | "match-result";

export type Card = {
  id: string;
  suit: Suit;
  value: CardValue;
  label: string;
  power: number;
};

export type TableCard = {
  id: string;
  card: Card;
  playerId: string;
  playedAt: string;
  trickNumber: number;
};

export type Room = {
  id: string;
  code: string;
  hostId: string;
  status: RoomStatus;
  currentRound: number;
  handSize: number;
  currentTurnPlayerId: string | null;
  currentTrick: number;
  trickStarterPlayerId: string | null;
  roundStarterPlayerId: string | null;
  firstRoundStarterPlayerId?: string | null;
  tableOrder?: string[];
  bidTurnStartedAt: string | null;
  bidTimeLimitSeconds: number;
  startingLives?: StartingLives;
  trickPhase?: TrickPhase;
  isResolvingTrick?: boolean;
  trickRevealStartedAt?: string | null;
  trickRevealEndsAt?: string | null;
  isShowingTrickResult?: boolean;
  trickResultStartedAt?: string | null;
  trickResultEndsAt?: string | null;
  createdAt: string;
  updatedAt: string;
  gameMode?: GameMode;
};

export type Player = {
  id: string;
  roomId: string;
  name: string;
  lives: number;
  isAlive: boolean;
  isHost: boolean;
  isConnected: boolean;
  isInactive?: boolean;
  pendingKick?: boolean;
  lastSeenAt?: string;
  isSpectator: boolean;
  bid: number | null;
  tricksWon: number;
  hand: Card[];
  joinedAt: string;
  isBot?: boolean;
};

export type RoundPlayerResult = {
  playerId: string;
  playerName: string;
  name: string;
  bid: number | null;
  tricksWon: number;
  difference: number;
  matchedBid: boolean;
  livesBefore: number;
  remainingLives: number;
  livesAfter: number;
  livesLost: number;
  lostLife: number;
  wasEliminated: boolean;
  eliminated: boolean;
};

export type RoundHistoryEntry = {
  round: number;
  handSize: number;
  finishedAt: string;
  results: RoundPlayerResult[];
};

export type RankingEntry = {
  playerId: string;
  name: string;
  place: number;
  reason: "winner" | "eliminated";
  round: number;
};

export type LastTrick = {
  trickNumber: number;
  cards: TableCard[];
  winnerPlayerId: string | null;
  startedByPlayerId: string | null;
  message?: string;
};

export type GameEventType =
  | "turn"
  | "bid"
  | "trick"
  | "kick"
  | "inactive"
  | "round_end"
  | "life_lost"
  | "eliminated";

export type GameEvent = {
  id: string;
  type: GameEventType;
  message: string;
  createdAt: string;
  playerId?: string;
};

export type GameState = {
  roomId: string;
  deck: Card[];
  tableCards: TableCard[];
  playedCards: TableCard[];
  roundHistory: RoundHistoryEntry[];
  winners: string[];
  ranking: RankingEntry[];
  lastTrick: LastTrick | null;
  lastTrickCards: TableCard[];
  lastTrickWinnerId: string | null;
  lastTrickMessage: string | null;
  events?: GameEvent[];
  truco?: TrucoGameState;
};

export type TrucoPendingCall = {
  type: Exclude<TrucoCall, "none">;
  byPlayerId: string;
  points: number;
  answeredByPlayerId?: string | null;
};

export type TrucoGameState = {
  phase: TrucoPhase;
  teamPoints: Record<TrucoTeam, number>;
  teamMatchsticks: Record<TrucoTeam, number>;
  teamHandsWon: Record<TrucoTeam, number>;
  playerTeams: Record<string, TrucoTeam>;
  currentDealerId: string | null;
  currentTurnPlayerId: string | null;
  handNumber: number;
  trickNumber: number;
  tricksWon: Record<string, number>;
  tableCards: TableCard[];
  deck: Card[];
  pendingCall: TrucoPendingCall | null;
  acceptedCall: TrucoCall;
  handWinnerTeam: TrucoTeam | null;
  handMessage: string | null;
  lastAction: string | null;
};

export type GameSnapshot = {
  room: Room;
  players: Player[];
  gameState: GameState;
};

export type VisiblePlayer = Omit<Player, "hand"> & {
  hand: Card[];
  hiddenCardCount: number;
};

export type VisibleGameSnapshot = Omit<GameSnapshot, "players"> & {
  players: VisiblePlayer[];
};

export type RoomRecord = {
  id: string;
  code: string;
  host_id: string;
  status: RoomStatus;
  state: GameSnapshot;
  created_at: string;
  updated_at: string;
};
