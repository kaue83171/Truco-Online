import { generateDeck, shuffleDeck } from "./deck";
import type {
  Card,
  GameSnapshot,
  Player,
  TableCard,
  TrucoCall,
  TrucoPendingCall,
  TrucoTeam,
} from "../types/game";

function clone(snapshot: GameSnapshot): GameSnapshot {
  return structuredClone(snapshot);
}

function now() {
  return new Date().toISOString();
}

function activePlayers(snapshot: GameSnapshot): Player[] {
  const order = snapshot.room.tableOrder ?? snapshot.players.map((player) => player.id);
  const byId = new Map(snapshot.players.map((player) => [player.id, player]));
  return order.map((id) => byId.get(id)).filter((player): player is Player => Boolean(player && !player.isSpectator));
}

function teamFor(snapshot: GameSnapshot, playerId: string): TrucoTeam {
  return snapshot.gameState.truco?.playerTeams[playerId] ?? "A";
}

function nextPlayer(snapshot: GameSnapshot, playerId: string): string {
  const players = activePlayers(snapshot);
  const index = players.findIndex((player) => player.id === playerId);
  return players[(index + 1 + players.length) % players.length]?.id ?? players[0]?.id ?? playerId;
}

function handWinner(tableCards: TableCard[]): string | null {
  if (tableCards.length === 0) return null;
  const highest = Math.max(...tableCards.map((entry) => entry.card.power));
  const winners = tableCards.filter((entry) => entry.card.power === highest);
  return winners.length === 1 ? winners[0].playerId : null;
}

function tableCardStarter(cards: TableCard[]): string | null {
  return cards[0]?.playerId ?? null;
}

function winningTeamForHand(
  truco: NonNullable<GameSnapshot["gameState"]["truco"]>,
  teamTricks: number,
  otherTricks: number,
  currentTeam: TrucoTeam | null,
  otherTeam: TrucoTeam
): TrucoTeam | null {
  if (teamTricks > otherTricks && currentTeam) return currentTeam;
  if (otherTricks > teamTricks) return otherTeam;
  const winners = truco.trickWinners ?? [];
  const first = winners[0];
  const second = winners[1];
  const third = winners[2];
  if (first && second && !third) return first;
  if (!first && second) return second;
  if (first && !second) return first;
  return third ?? currentTeam ?? otherTeam;
}

function pointsForCall(call: TrucoCall): number {
  if (call === "vale-quatro") return 4;
  if (call === "retruco") return 3;
  if (call === "truco") return 2;
  if (call === "flor") return 3;
  if (call === "envido") return 2;
  return 1;
}

function addPoints(snapshot: GameSnapshot, team: TrucoTeam, points: number): void {
  const truco = snapshot.gameState.truco;
  if (!truco) return;
  truco.teamPoints[team] = Math.min(12, truco.teamPoints[team] + points);
  truco.teamMatchsticks[team] = truco.teamPoints[team];
}

function dealTrucoHand(snapshot: GameSnapshot, dealerId: string | null): GameSnapshot {
  const draft = clone(snapshot);
  const truco = draft.gameState.truco;
  if (!truco) return draft;
  const players = activePlayers(draft);
  const deck = shuffleDeck(generateDeck());
  const nextDealer = dealerId ?? players[0]?.id ?? null;
  const startIndex = players.findIndex((player) => player.id === nextDealer);
  const rotated = players.slice(startIndex + 1).concat(players.slice(0, startIndex + 1));
  const hands = new Map(players.map((player) => [player.id, [] as Card[]]));
  for (let cardIndex = 0; cardIndex < 3; cardIndex += 1) {
    for (const player of rotated) hands.get(player.id)?.push(deck.shift() as Card);
  }
  const nextStarter = rotated[0]?.id ?? players[0]?.id ?? null;
  draft.players = draft.players.map((player) => ({
    ...player,
    hand: hands.get(player.id) ?? [],
    bid: null,
    tricksWon: 0,
  }));
  truco.phase = "playing";
  truco.currentDealerId = nextDealer;
  truco.currentTurnPlayerId = nextStarter;
  truco.handNumber += 1;
  truco.trickNumber = 1;
  truco.tricksWon = Object.fromEntries(players.map((player) => [player.id, 0]));
  truco.trickWinners = [];
  truco.tableCards = [];
  truco.completedTricks = [];
  truco.lastTrickWinnerId = null;
  truco.deck = deck;
  truco.pendingCall = null;
  truco.acceptedCall = "none";
  truco.handWinnerTeam = null;
  truco.handMessage = null;
  truco.lastAction = `Mão ${truco.handNumber} distribuída`;
  draft.room.status = "playing";
  draft.room.currentTurnPlayerId = nextStarter;
  draft.room.updatedAt = now();
  return draft;
}

export function startTrucoGame(snapshot: GameSnapshot): GameSnapshot {
  const players = activePlayers(snapshot);
  if (players.length < 2 || players.length > 6 || players.length % 2 !== 0) {
    throw new Error("O Truco Gaúcho precisa de 2, 4 ou 6 jogadores.");
  }
  const draft = clone(snapshot);
  const truco = draft.gameState.truco ?? {
    phase: "waiting",
    teamPoints: { A: 0, B: 0 },
    teamMatchsticks: { A: 0, B: 0 },
    teamHandsWon: { A: 0, B: 0 },
    playerTeams: {},
    currentDealerId: null,
    currentTurnPlayerId: null,
    handNumber: 0,
    trickNumber: 0,
    tricksWon: {},
    trickWinners: [],
    tableCards: [],
    completedTricks: [],
    lastTrickWinnerId: null,
    deck: [],
    pendingCall: null,
    acceptedCall: "none",
    handWinnerTeam: null,
    handMessage: null,
    lastAction: null,
  };
  truco.playerTeams = Object.fromEntries(players.map((player, index) => [player.id, index % 2 === 0 ? "A" : "B"]));
  draft.gameState.truco = truco;
  draft.room.status = "playing";
  return dealTrucoHand(draft, null);
}

export function nextTrucoHand(snapshot: GameSnapshot): GameSnapshot {
  const truco = snapshot.gameState.truco;
  if (!truco) return snapshot;
  if (truco.teamPoints.A >= 12 || truco.teamPoints.B >= 12) return snapshot;
  return dealTrucoHand(snapshot, truco.currentDealerId);
}

export function playTrucoCard(snapshot: GameSnapshot, playerId: string, cardId: string): GameSnapshot {
  const draft = clone(snapshot);
  const truco = draft.gameState.truco;
  if (!truco || truco.phase !== "playing" || truco.currentTurnPlayerId !== playerId || truco.pendingCall) {
    throw new Error("Agora não é a sua vez de jogar.");
  }
  const player = draft.players.find((entry) => entry.id === playerId);
  const card = player?.hand.find((entry) => entry.id === cardId);
  if (!player || !card) throw new Error("Essa carta não está na sua mão.");
  player.hand = player.hand.filter((entry) => entry.id !== cardId);
  const tableCard: TableCard = { id: crypto.randomUUID(), card, playerId, playedAt: now(), trickNumber: truco.trickNumber };
  truco.tableCards.push(tableCard);
  const players = activePlayers(draft);
  if (truco.tableCards.length < players.length) {
    truco.currentTurnPlayerId = nextPlayer(draft, playerId);
    draft.room.currentTurnPlayerId = truco.currentTurnPlayerId;
    truco.lastAction = `${player.name} jogou ${card.label}`;
    draft.room.updatedAt = now();
    return draft;
  }
  const winnerId = handWinner(truco.tableCards);
  truco.completedTricks.push([...truco.tableCards]);
  truco.lastTrickWinnerId = winnerId;
  if (winnerId) truco.tricksWon[winnerId] = (truco.tricksWon[winnerId] ?? 0) + 1;
  const winningTeam = winnerId ? teamFor(draft, winnerId) : null;
  truco.trickWinners.push(winningTeam);
  const teamTricks = winningTeam ? players.filter((entry) => teamFor(draft, entry.id) === winningTeam).reduce((sum, entry) => sum + (truco.tricksWon[entry.id] ?? 0), 0) : 0;
  const otherTeam: TrucoTeam = winningTeam === "A" ? "B" : "A";
  const otherTricks = players.filter((entry) => teamFor(draft, entry.id) === otherTeam).reduce((sum, entry) => sum + (truco.tricksWon[entry.id] ?? 0), 0);
  const handOver = teamTricks >= 2 || otherTricks >= 2 || truco.trickNumber >= 3;
  if (!handOver && truco.trickNumber < 3) {
    truco.trickNumber += 1;
    truco.tableCards = [];
    const nextStarter = winnerId ?? tableCardStarter(truco.completedTricks[truco.completedTricks.length - 1]);
    truco.currentTurnPlayerId = nextStarter;
    draft.room.currentTurnPlayerId = nextStarter;
    truco.lastAction = winnerId ? `${draft.players.find((entry) => entry.id === winnerId)?.name ?? "Jogador"} ganhou a vaza` : "Vaza empatada; a mão continua";
    draft.room.updatedAt = now();
    return draft;
  }
  const handWinnerTeam = winningTeamForHand(truco, teamTricks, otherTricks, winningTeam, otherTeam);
  if (handWinnerTeam) {
    const points = pointsForCall(truco.acceptedCall);
    addPoints(draft, handWinnerTeam, points);
    truco.teamHandsWon[handWinnerTeam] += 1;
  }
  truco.handWinnerTeam = handWinnerTeam;
  truco.handMessage = handWinnerTeam ? `Equipe ${handWinnerTeam} ganhou a mão e marcou ${pointsForCall(truco.acceptedCall)} ponto(s).` : "Mão empatada.";
  truco.phase = truco.teamPoints.A >= 12 || truco.teamPoints.B >= 12 ? "match-result" : "hand-result";
  truco.currentTurnPlayerId = null;
  draft.room.currentTurnPlayerId = null;
  draft.room.updatedAt = now();
  return draft;
}

export function callTruco(snapshot: GameSnapshot, playerId: string, type: Exclude<TrucoCall, "none">): GameSnapshot {
  const draft = clone(snapshot);
  const truco = draft.gameState.truco;
  if (!truco || truco.phase !== "playing" || truco.currentTurnPlayerId !== playerId) throw new Error("Você só pode cantar na sua vez.");
  if (type === "flor") {
    const hand = draft.players.find((player) => player.id === playerId)?.hand ?? [];
    if (hand.length !== 3 || new Set(hand.map((card) => card.suit)).size !== 1) throw new Error("Você só pode cantar flor com três cartas do mesmo naipe.");
  }
  const pending: TrucoPendingCall = { type, byPlayerId: playerId, points: pointsForCall(type), answeredByPlayerId: null };
  truco.pendingCall = pending;
  truco.phase = "call";
  truco.currentTurnPlayerId = nextPlayer(draft, playerId);
  draft.room.currentTurnPlayerId = truco.currentTurnPlayerId;
  truco.lastAction = `${draft.players.find((player) => player.id === playerId)?.name ?? "Jogador"} cantou ${type}`;
  draft.room.updatedAt = now();
  return draft;
}

export function answerTrucoCall(snapshot: GameSnapshot, playerId: string, accept: boolean): GameSnapshot {
  const draft = clone(snapshot);
  const truco = draft.gameState.truco;
  const pending = truco?.pendingCall;
  if (!truco || truco.phase !== "call" || !pending || teamFor(draft, playerId) === teamFor(draft, pending.byPlayerId)) throw new Error("A equipe adversária deve responder ao canto.");
  if (!accept) {
    const winner = teamFor(draft, pending.byPlayerId);
    addPoints(draft, winner, Math.max(1, pending.points - 1));
    truco.handWinnerTeam = winner;
    truco.handMessage = `Equipe ${winner} ganhou por recusa.`;
    truco.phase = truco.teamPoints.A >= 12 || truco.teamPoints.B >= 12 ? "match-result" : "hand-result";
  } else {
    truco.acceptedCall = pending.type;
    truco.pendingCall = null;
    truco.phase = "playing";
    truco.currentTurnPlayerId = nextPlayer(draft, pending.byPlayerId);
    draft.room.currentTurnPlayerId = truco.currentTurnPlayerId;
    truco.lastAction = `${draft.players.find((entry) => entry.id === playerId)?.name ?? "Jogador"} aceitou o canto`;
  }
  draft.room.updatedAt = now();
  return draft;
}

export function addTrucoBot(snapshot: GameSnapshot, botName: string): GameSnapshot {
  const draft = clone(snapshot);
  const id = crypto.randomUUID();
  const bot: Player = { id, roomId: draft.room.id, name: botName, lives: 0, isAlive: true, isHost: false, isConnected: true, isSpectator: false, bid: null, tricksWon: 0, hand: [], joinedAt: now(), isBot: true };
  draft.players.push(bot);
  draft.room.tableOrder = [...(draft.room.tableOrder ?? []), id];
  draft.room.updatedAt = now();
  return draft;
}

export function playBotTurn(snapshot: GameSnapshot): GameSnapshot {
  const truco = snapshot.gameState.truco;
  const current = snapshot.players.find((player) => player.id === truco?.currentTurnPlayerId);
  if (!truco || !current?.isBot) return snapshot;
  if (truco.phase === "call" && truco.pendingCall) return answerTrucoCall(snapshot, current.id, true);
  const card = current.hand[0];
  if (!card) return snapshot;
  return playTrucoCard(snapshot, current.id, card.id);
}
