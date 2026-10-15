import { LogOut, MessageCircle, Shield, Trophy } from "lucide-react";
import { PlayingCard } from "./Card";
import type { Card, GameSnapshot, TrucoCall, VisibleGameSnapshot } from "../types/game";

type Props = {
  snapshot: VisibleGameSnapshot;
  currentPlayerId: string | null;
  isBusy: boolean;
  onLeave: () => void;
  onPlayCard: (cardId: string) => void;
  onCall: (call: Exclude<TrucoCall, "none">) => void;
  onAnswer: (accept: boolean) => void;
  onRaiseRealEnvido: () => void;
  onNextHand: () => void;
};

export function TrucoBoard({ snapshot, currentPlayerId, isBusy, onLeave, onPlayCard, onCall, onAnswer, onRaiseRealEnvido, onNextHand }: Props) {
  const truco = snapshot.gameState.truco;
  const current = snapshot.players.find((player) => player.id === currentPlayerId);
  const pending = truco?.pendingCall;
  if (!truco || !current) return null;
  const completedTricks = truco.completedTricks ?? [];
  const targetPoints = truco.targetPoints ?? 30;
  const isMyTurn = truco.currentTurnPlayerId === currentPlayerId;
  const teamOf = (id: string) => truco.playerTeams[id] ?? "A";
  const tableCards = truco.tableCards;
  const orderedPlayers = (snapshot.room.tableOrder ?? snapshot.players.map((player) => player.id))
    .map((id) => snapshot.players.find((player) => player.id === id))
    .filter((player): player is (typeof snapshot.players)[number] => Boolean(player && !player.isSpectator));
  const lastCompletedTrickIndex = completedTricks.length - 1;
  const playedThisHand = [...completedTricks.flat(), ...tableCards];
  const latestCardByPlayer = new Map<string, (typeof playedThisHand)[number]>();
  playedThisHand.forEach((entry) => latestCardByPlayer.set(entry.playerId, entry));
  const canCall = isMyTurn && truco.phase === "playing" && !pending;
  const calls: Array<{ type: Exclude<TrucoCall, "none">; label: string }> = [
    { type: "envido", label: "Envido" },
    { type: "flor", label: "Flor" },
    { type: "truco", label: "Truco" },
    { type: "retruco", label: "Retruco" },
    { type: "vale-quatro", label: "Vale quatro" },
  ];
  return (
    <main className="min-h-screen px-4 py-5 sm:px-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-amber-200/70">truco gaúcho</p>
          <h1 className="font-display text-3xl font-bold text-white">A mesa está valendo</h1>
        </div>
        <button type="button" onClick={onLeave} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm text-white/75 hover:bg-white/10"><LogOut size={16} /> sair</button>
      </header>
      <section className="mx-auto mt-5 grid max-w-6xl gap-4 lg:grid-cols-[1fr_18rem]">
        <div className="table-board min-h-[34rem] rounded-[2rem] p-4 sm:p-7">
          <div className="flex min-h-[32rem] flex-col gap-3 sm:flex-row">
            <aside className="max-h-40 shrink-0 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-2 sm:max-h-[32rem] sm:w-28" aria-label="Histórico das cartas desta mão">
              <p className="sticky top-0 z-10 mb-2 rounded bg-[#173c2d] py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-amber-100">Cartas desta mão</p>
              <div className="space-y-1.5">
                {playedThisHand.length ? playedThisHand.map((entry, index) => {
                  const playerName = snapshot.players.find((player) => player.id === entry.playerId)?.name ?? "Jogador";
                  const isWinner = entry.trickNumber === (tableCards.length === orderedPlayers.length ? truco.trickNumber : completedTricks[lastCompletedTrickIndex]?.[0]?.trickNumber) && entry.playerId === truco.lastTrickWinnerId && (tableCards.length === 0 || tableCards.length === orderedPlayers.length);
                  return <div key={entry.id} className={`flex items-center gap-1 rounded-md p-1 ${isWinner ? "bg-emerald-200/15 ring-1 ring-emerald-200/60" : "bg-white/[0.04]"}`} title={`${index + 1}. ${playerName}: ${entry.card.label}`}>
                    <PlayingCard card={entry.card} compact disabled />
                    <span className="min-w-0 truncate text-[9px] text-white/65">{playerName}</span>
                  </div>;
                }) : <p className="py-2 text-center text-[10px] text-white/40">Ainda sem jogadas</p>}
              </div>
            </aside>
          <div className="table-oval relative flex min-h-[32rem] min-w-0 flex-1 flex-col justify-between rounded-[2rem] p-4 sm:rounded-[45%] sm:p-8">
            <div className="flex flex-wrap justify-between gap-3 text-sm">
              {(["A", "B"] as const).map((team) => (
                <div key={team} className="rounded-xl border border-white/15 bg-black/20 px-4 py-2 text-white"><span className="text-white/50">equipe {team}</span><strong className="ml-2 text-xl text-amber-200">{truco.teamPoints[team]}</strong><span className="ml-2 text-xs text-white/40">palitos</span></div>
              ))}
            </div>
            <div className="mx-auto flex min-h-16 w-full items-center justify-center px-2 py-3 text-center" aria-label="Última ação">
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/55">{truco.lastAction ?? "A mão está começando"}</div>
            </div>
            <div className={`grid gap-2 ${orderedPlayers.length <= 2 ? "grid-cols-2" : orderedPlayers.length <= 4 ? "grid-cols-2" : "grid-cols-3"}`}>
              {orderedPlayers.map((player) => {
                const heldCards: Array<{ id: string; card?: Card; hidden: boolean }> = player.id === currentPlayerId
                  ? player.hand.map((card) => ({ id: card.id, card, hidden: false }))
                  : Array.from({ length: player.hiddenCardCount }, (_, index) => ({ id: `hidden-${player.id}-${index}`, hidden: true }));
                const latestPlayedCard = latestCardByPlayer.get(player.id);
                const highlightLatestCard = Boolean(latestPlayedCard && latestPlayedCard.playerId === truco.lastTrickWinnerId && (tableCards.length === 0 && lastCompletedTrickIndex >= 0 && latestPlayedCard.trickNumber === completedTricks[lastCompletedTrickIndex]?.[0]?.trickNumber || tableCards.length === orderedPlayers.length && latestPlayedCard.trickNumber === truco.trickNumber));
                return <div key={player.id} className={`rounded-xl border p-2 text-xs ${truco.currentTurnPlayerId === player.id ? "border-amber-200/60 bg-amber-100/10" : "border-white/10 bg-black/15"}`}>
                  {truco.playerLastActions?.[player.id] ? <div className="relative mb-2 w-fit max-w-full rounded-xl border border-amber-100/25 bg-[#f7efdc] px-2.5 py-1.5 text-[11px] font-semibold text-emerald-950 shadow-lg"><span className="block truncate">{truco.playerLastActions[player.id]}</span><span className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 border-b border-r border-amber-100/25 bg-[#f7efdc]" /></div> : null}
                  {latestPlayedCard ? <div className="mb-2 flex justify-center"><span className={highlightLatestCard ? "rounded-md ring-2 ring-emerald-300 shadow-[0_0_0.9rem_rgba(110,231,183,0.65)]" : "opacity-85"}><PlayingCard card={latestPlayedCard.card} compact disabled /></span></div> : null}
                  <div className="flex items-center justify-between gap-2 text-white"><span className="truncate">{player.name}{player.isBot ? " · bot" : ""}</span><span className="text-amber-200">equipe {teamOf(player.id)}</span></div>
                  <div className="mt-2 flex items-center gap-1 overflow-x-auto">
                    {heldCards.map((card) => <PlayingCard key={card.id} card={card.card} hidden={card.hidden} compact disabled={card.hidden || !isMyTurn || isBusy} onClick={card.hidden ? undefined : () => onPlayCard(card.id)} />)}
                  </div>
                  <span className="mt-1 block text-white/45">{player.id === currentPlayerId ? "você" : `${truco.tricksWon[player.id] ?? 0} vazas`}{truco.lastTrickWinnerId === player.id ? " · ganhou a última vaza" : ""}</span>
                </div>
              })}
            </div>
          </div>
          </div>
        </div>
        <aside className="felt-panel rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm text-white/70"><Trophy size={17} className="text-amber-200" /> placar até {targetPoints}</div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center"><div className="rounded-xl bg-white/[0.06] p-3"><p className="text-xs text-white/45">Equipe A</p><p className="text-3xl font-bold text-amber-200">{truco.teamPoints.A}</p></div><div className="rounded-xl bg-white/[0.06] p-3"><p className="text-xs text-white/45">Equipe B</p><p className="text-3xl font-bold text-amber-200">{truco.teamPoints.B}</p></div></div>
          <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-white/65"><Shield size={16} className="mb-2 text-amber-200" />{truco.lastAction ?? "Aguardando ação"}</div>
          {pending ? <div className="mt-4 rounded-xl border border-amber-200/30 bg-amber-200/10 p-3"><p className="text-sm font-semibold text-amber-100">{pending.type} — vale {pending.points}</p><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={isBusy} onClick={() => onAnswer(true)} className="rounded-lg bg-amber-200 px-2 py-2 text-sm font-bold text-mesa-950">aceitar</button><button type="button" disabled={isBusy} onClick={() => onAnswer(false)} className="rounded-lg border border-white/20 px-2 py-2 text-sm text-white">correr</button>{pending.type === "envido" ? <button type="button" disabled={isBusy} onClick={onRaiseRealEnvido} className="col-span-2 rounded-lg border border-amber-100/30 px-2 py-2 text-sm font-semibold text-amber-100">aumentar para Real Envido</button> : null}</div></div> : null}
          {truco.phase === "hand-result" ? <button type="button" onClick={onNextHand} disabled={isBusy} className="mt-4 w-full rounded-lg bg-amber-200 px-3 py-3 font-bold text-mesa-950">próxima mão</button> : null}
          {truco.phase === "match-result" ? <div className="mt-4 rounded-xl border border-amber-200/30 bg-amber-200/10 p-3 text-center"><p className="text-xs uppercase tracking-wider text-amber-100/70">partida encerrada</p><p className="mt-1 font-bold text-amber-100">Equipe {truco.teamPoints.A >= targetPoints ? "A" : "B"} venceu!</p></div> : null}
          <div className="mt-5 border-t border-white/10 pt-4"><p className="mb-2 text-xs uppercase tracking-wider text-white/45">cantos</p><div className="grid grid-cols-2 gap-2">{calls.map((call) => <button key={call.type} type="button" disabled={!canCall || isBusy} onClick={() => onCall(call.type)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/15 px-2 py-2 text-xs font-semibold text-white/80 hover:border-amber-200/50 disabled:opacity-35"><MessageCircle size={13} />{call.label}</button>)}</div></div>
        </aside>
      </section>
    </main>
  );
}

export type TrucoSnapshot = GameSnapshot;
