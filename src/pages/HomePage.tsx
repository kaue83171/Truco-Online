import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, HelpCircle, LogIn, Plus, Sparkles, WifiOff } from "lucide-react";
import { FinalResult } from "../components/FinalResult";
import { GameBoard } from "../components/GameBoard";
import { Lobby } from "../components/Lobby";
import { TutorialModal } from "../components/TutorialModal";
import {
  advanceAfterTrickResult,
  autoSubmitCurrentBid,
  getBidTimeLimitSeconds,
  kickPlayer,
  playCard as playCardInSnapshot,
  resetGame,
  setBidTimeLimit,
  setStartingLives,
  startGame,
  startRound,
  submitBid as submitBidInSnapshot,
  TRICK_RESULT_DISPLAY_MS,
} from "../lib/gameEngine";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import {
  clearStoredSession,
  createRoom,
  joinRoom,
  leaveRoom,
  markPlayerConnection,
  updateRoom,
} from "../lib/roomService";
import { subscribeToPresence, subscribeToRoomState } from "../lib/realtimeService";
import { getVisibleGameStateForPlayer } from "../lib/visibleState";
import type { GameSnapshot } from "../types/game";

function getInitialRoomCode(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("room") ?? "";
}

export function HomePage() {
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState(getInitialRoomCode);
  const [snapshot, setSnapshot] = useState<GameSnapshot | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const visibleSnapshot = useMemo(
    () => (snapshot ? getVisibleGameStateForPlayer(snapshot, currentPlayerId) : null),
    [snapshot, currentPlayerId]
  );
  const currentRoomId = snapshot?.room.id ?? null;
  const currentPlayerIsHost = Boolean(
    visibleSnapshot?.players.some(
      (player) => player.id === currentPlayerId && player.id === visibleSnapshot.room.hostId
    )
  );

  useEffect(() => {
    clearStoredSession();
  }, []);

  useEffect(() => {
    if (!currentRoomId) {
      return undefined;
    }

    return subscribeToRoomState(currentRoomId, setSnapshot);
  }, [currentRoomId]);

  useEffect(() => {
    if (!currentRoomId || !currentPlayerId) {
      return undefined;
    }

    return subscribeToPresence(currentRoomId, currentPlayerId, (connectedIds) => {
      setSnapshot((currentSnapshot) => {
        if (!currentSnapshot) {
          return currentSnapshot;
        }

        return {
          ...currentSnapshot,
          players: currentSnapshot.players.map((player) => ({
            ...player,
            isConnected: connectedIds.includes(player.id),
          })),
        };
      });
    });
  }, [currentRoomId, currentPlayerId]);

  useEffect(() => {
    function handlePageExit() {
      clearStoredSession();

      if (currentRoomId && currentPlayerId) {
        void markPlayerConnection(currentRoomId, currentPlayerId, false).catch(() => undefined);
      }
    }

    function clearBrowserSession() {
      clearStoredSession();
    }

    window.addEventListener("pagehide", handlePageExit);
    window.addEventListener("beforeunload", clearBrowserSession);

    return () => {
      window.removeEventListener("pagehide", handlePageExit);
      window.removeEventListener("beforeunload", clearBrowserSession);
    };
  }, [currentRoomId, currentPlayerId]);

  useEffect(() => {
    if (
      !snapshot ||
      !currentPlayerId ||
      snapshot.room.status !== "betting" ||
      snapshot.room.hostId !== currentPlayerId ||
      !snapshot.room.currentTurnPlayerId
    ) {
      return undefined;
    }

    const turnStartedAt = snapshot.room.bidTurnStartedAt ?? snapshot.room.updatedAt;
    const startedAtMs = new Date(turnStartedAt).getTime();
    const limitMs = getBidTimeLimitSeconds(snapshot) * 1000;
    const elapsedMs = Number.isFinite(startedAtMs) ? Date.now() - startedAtMs : 0;
    const timeoutMs = Math.max(0, limitMs - elapsedMs) + 150;
    const roomId = snapshot.room.id;

    const timeoutId = window.setTimeout(() => {
      setError(null);
      setIsBusy(true);
      updateRoom(roomId, autoSubmitCurrentBid)
        .then(setSnapshot)
        .catch((caughtError) => {
          setError(caughtError instanceof Error ? caughtError.message : "Algo deu errado.");
        })
        .finally(() => setIsBusy(false));
    }, timeoutMs);

    return () => window.clearTimeout(timeoutId);
  }, [
    currentPlayerId,
    snapshot,
  ]);

  useEffect(() => {
    if (
      !snapshot ||
      !currentPlayerId ||
      snapshot.room.status !== "playing" ||
      (snapshot.room.trickPhase !== "result" && !snapshot.room.isShowingTrickResult) ||
      snapshot.room.hostId !== currentPlayerId
    ) {
      return undefined;
    }

    const resultEndsAtMs = snapshot.room.trickResultEndsAt
      ? new Date(snapshot.room.trickResultEndsAt).getTime()
      : Number.NaN;
    const resultStartedAtMs = new Date(
      snapshot.room.trickResultStartedAt ?? snapshot.room.updatedAt
    ).getTime();
    const fallbackEndsAtMs = Number.isFinite(resultStartedAtMs)
      ? resultStartedAtMs + TRICK_RESULT_DISPLAY_MS
      : Date.now() + TRICK_RESULT_DISPLAY_MS;
    const endsAtMs = Number.isFinite(resultEndsAtMs) ? resultEndsAtMs : fallbackEndsAtMs;
    const timeoutMs = Math.max(0, endsAtMs - Date.now()) + 150;
    const roomId = snapshot.room.id;

    const timeoutId = window.setTimeout(() => {
      setError(null);
      setIsBusy(true);
      updateRoom(roomId, advanceAfterTrickResult)
        .then(setSnapshot)
        .catch((caughtError) => {
          setError(caughtError instanceof Error ? caughtError.message : "Algo deu errado.");
        })
        .finally(() => setIsBusy(false));
    }, timeoutMs);

    return () => window.clearTimeout(timeoutId);
  }, [currentPlayerId, snapshot]);

  async function runAction(action: () => Promise<GameSnapshot | null | void>) {
    setError(null);
    setIsBusy(true);

    try {
      const nextSnapshot = await action();

      if (nextSnapshot) {
        setSnapshot(nextSnapshot);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Algo deu errado.");
    } finally {
      setIsBusy(false);
    }
  }

  function ensureNickname(): string {
    const trimmedName = nickname.trim();

    if (!trimmedName) {
      throw new Error("Digite um apelido.");
    }

    return trimmedName;
  }

  async function handleCreateRoom() {
    await runAction(async () => {
      const roomEntry = await createRoom(ensureNickname());
      setCurrentPlayerId(roomEntry.playerId);
      return roomEntry.snapshot;
    });
  }

  async function handleJoinRoom() {
    await runAction(async () => {
      if (!roomCode.trim()) {
        throw new Error("Digite o código da sala.");
      }

      const roomEntry = await joinRoom(roomCode, ensureNickname());
      setCurrentPlayerId(roomEntry.playerId);
      return roomEntry.snapshot;
    });
  }

  async function handleSnapshotUpdate(updater: (gameSnapshot: GameSnapshot) => GameSnapshot) {
    if (!snapshot) {
      return;
    }

    await runAction(() => updateRoom(snapshot.room.id, updater));
  }

  async function handleKickPlayer(playerId: string) {
    if (!currentPlayerId) {
      return;
    }

    await handleSnapshotUpdate((current) => kickPlayer(current, currentPlayerId, playerId));
  }

  async function handleLeave() {
    const leavingRoomId = snapshot?.room.id ?? null;
    const leavingPlayerId = currentPlayerId;

    clearStoredSession();
    setSnapshot(null);
    setCurrentPlayerId(null);

    if (leavingRoomId && leavingPlayerId) {
      await leaveRoom(leavingRoomId, leavingPlayerId).catch(() => undefined);
    }
  }

  if (visibleSnapshot?.room.status === "lobby") {
    return (
      <>
        <Lobby
          snapshot={visibleSnapshot}
          currentPlayerId={currentPlayerId}
          isBusy={isBusy}
          onLeave={handleLeave}
          onStartGame={() => handleSnapshotUpdate(startGame)}
          onSetBidTimeLimit={(seconds) =>
            handleSnapshotUpdate((current) => setBidTimeLimit(current, seconds))
          }
          onSetStartingLives={(lives) =>
            handleSnapshotUpdate((current) => setStartingLives(current, lives))
          }
          onKickPlayer={handleKickPlayer}
        />
        {error ? <ErrorToast message={error} /> : null}
      </>
    );
  }

  if (visibleSnapshot?.room.status === "finished") {
    return (
      <>
        <FinalResult
          snapshot={visibleSnapshot}
          currentPlayerIsHost={currentPlayerIsHost}
          isBusy={isBusy}
          onBackToLobby={() => handleSnapshotUpdate(resetGame)}
          onPlayAgain={() => handleSnapshotUpdate((current) => startGame(resetGame(current)))}
        />
        {error ? <ErrorToast message={error} /> : null}
      </>
    );
  }

  if (visibleSnapshot) {
    return (
      <>
        <GameBoard
          snapshot={visibleSnapshot}
          currentPlayerId={currentPlayerId}
          isBusy={isBusy}
          onLeave={handleLeave}
          onNextRound={() => handleSnapshotUpdate(startRound)}
          onKickPlayer={handleKickPlayer}
          onPlayCard={(cardId) =>
            currentPlayerId
              ? handleSnapshotUpdate((current) =>
                  playCardInSnapshot(current, currentPlayerId, cardId)
                )
              : undefined
          }
          onSubmitBid={(bid) =>
            currentPlayerId
              ? handleSnapshotUpdate((current) =>
                  submitBidInSnapshot(current, currentPlayerId, bid)
                )
              : undefined
          }
        />
        {error ? <ErrorToast message={error} /> : null}
      </>
    );
  }

  return (
    <main className="home-shell relative min-h-screen overflow-hidden px-4 py-6 sm:px-8 sm:py-9">
      <div className="home-glow home-glow-one" aria-hidden="true" />
      <div className="home-glow home-glow-two" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between">
          <a href="#inicio" className="flex items-center gap-3 text-white" aria-label="Fodinha, início">
            <span className="brand-mark" aria-hidden="true">F</span>
            <span className="text-sm font-semibold tracking-wide">jogo de mesa <span className="text-amber-200">online</span></span>
          </a>
          <button
            type="button"
            onClick={() => setTutorialOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-white/80 transition hover:border-amber-200/40 hover:bg-white/[0.08]"
          >
            <HelpCircle size={16} /> regras
          </button>
        </header>

        <div id="inicio" className="my-auto grid w-full items-center gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-16">
          <section className="home-intro">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-100/10 bg-emerald-100/[0.06] px-3 py-1.5 text-xs font-medium tracking-wide text-emerald-100/80">
              <Sparkles size={14} className="text-amber-200" /> partidas com os amigos, de onde estiverem
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200/80">truco gaúcho • palpites • blefe</p>
            <h1 className="mt-3 font-display text-6xl font-bold leading-[0.95] tracking-tight text-[#fffaf0] sm:text-8xl">Fodinha<span className="text-amber-300">.</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-emerald-50/65 sm:text-xl">
              Adivinhe suas vazas, leia a mesa e tente sobreviver até o fim. Reúna a turma numa sala privada e jogue direto pelo navegador.
            </p>
            <div className="mt-9 flex items-center gap-3 text-sm text-white/45">
              <span className="flex -space-x-2" aria-hidden="true">
                <span className="avatar-dot">♠</span><span className="avatar-dot">♥</span><span className="avatar-dot">♦</span>
              </span>
              <span>Uma mesa, seus amigos e coragem para cantar.</span>
            </div>

            {!isSupabaseConfigured ? (
              <div className="mt-8 flex gap-3 rounded-2xl border border-red-300/25 bg-red-400/[0.08] p-4 text-sm text-red-100">
                <WifiOff className="mt-0.5 shrink-0" size={18} />
                <p>Configure as variáveis do Supabase no arquivo .env para criar e entrar em salas online.</p>
              </div>
            ) : null}
          </section>

          <section className="home-card rounded-[1.75rem] p-5 sm:p-7" aria-label="Entrar ou criar sala">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/75">sua próxima partida</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Puxe uma cadeira.</h2>
              <p className="mt-1 text-sm text-white/50">Escolha um apelido para entrar na mesa.</p>
            </div>
            <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">Seu apelido</span>
              <input
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                maxLength={24}
                placeholder="Seu nome na mesa"
                className="home-input w-full rounded-xl border border-white/10 bg-[#f8f6ef] px-4 py-4 text-base font-medium text-mesa-950 placeholder:text-zinc-400"
              />
            </label>

            <button
              type="button"
              disabled={isBusy}
              onClick={handleCreateRoom}
              className="create-room-button inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-4 py-4 font-bold text-mesa-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Plus size={18} />
              Criar uma sala <ArrowDownRight size={17} />
            </button>

            <div className="relative py-1 text-center text-xs font-medium uppercase tracking-[0.2em] text-white/30"><span className="relative z-10 bg-[#10251c] px-3">ou entre com convite</span><span className="absolute left-0 right-0 top-1/2 border-t border-white/10" /></div>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">Código da sala</span>
                <input
                  value={roomCode}
                  onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                  placeholder="FOD-4821"
                  className="home-input w-full rounded-xl border border-white/10 bg-[#f8f6ef] px-4 py-4 font-mono text-base font-semibold uppercase tracking-widest text-mesa-950 placeholder:font-sans placeholder:tracking-normal placeholder:text-zinc-400"
                />
              </label>

              <button
                type="button"
                disabled={isBusy}
                onClick={handleJoinRoom}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-4 font-semibold text-white transition hover:border-white/30 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <LogIn size={18} />
                Entrar na sala
              </button>
            </div>
            <p className="mt-6 text-center text-xs leading-5 text-white/35">Sem cadastro. Só escolher um nome e chamar a turma.</p>
          </section>
        </div>
        <footer className="flex items-center justify-between border-t border-white/[0.08] pt-4 text-xs text-white/30">
          <span>Fodinha Online</span><span>Feito para jogar entre amigos</span>
        </footer>
      </div>

      <TutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
      {error ? <ErrorToast message={error} /> : null}
    </main>
  );
}

function ErrorToast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,34rem)] -translate-x-1/2 rounded-md border border-red-200/30 bg-red-950 px-4 py-3 text-sm text-red-50 shadow-2xl">
      {message}
    </div>
  );
}
