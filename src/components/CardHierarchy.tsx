type RankCard = { value: string; suit: string };

const ALL_SUITS = ["espadas", "paus", "ouro", "calice"];
const CARD_RANKS: { name: string; detail: string; cards: RankCard[] }[] = [
  { name: "Ás de espadas", detail: "Espadão", cards: [{ value: "A", suit: "espadas" }] },
  { name: "Ás de paus", detail: "Bastião", cards: [{ value: "A", suit: "paus" }] },
  { name: "7 de espadas", detail: "Espadilha", cards: [{ value: "7", suit: "espadas" }] },
  { name: "7 de ouro", detail: "Manilha", cards: [{ value: "7", suit: "ouro" }] },
  { name: "3", detail: "Todos os naipes empatam", cards: ALL_SUITS.map((suit) => ({ value: "3", suit })) },
  { name: "2", detail: "Todos os naipes empatam", cards: ALL_SUITS.map((suit) => ({ value: "2", suit })) },
  { name: "Ás de ouro e de copas", detail: "Empatam entre si", cards: ["ouro", "calice"].map((suit) => ({ value: "A", suit })) },
  { name: "Rei (12)", detail: "Todos os naipes empatam", cards: ALL_SUITS.map((suit) => ({ value: "12", suit })) },
  { name: "Cavalo (11)", detail: "Todos os naipes empatam", cards: ALL_SUITS.map((suit) => ({ value: "11", suit })) },
  { name: "Valete (10)", detail: "Todos os naipes empatam", cards: ALL_SUITS.map((suit) => ({ value: "10", suit })) },
  { name: "7 de paus e de copas", detail: "Empatam entre si", cards: ["paus", "calice"].map((suit) => ({ value: "7", suit })) },
  { name: "6", detail: "Todos os naipes empatam", cards: ALL_SUITS.map((suit) => ({ value: "6", suit })) },
  { name: "5", detail: "Todos os naipes empatam", cards: ALL_SUITS.map((suit) => ({ value: "5", suit })) },
  { name: "4", detail: "A menor carta", cards: ALL_SUITS.map((suit) => ({ value: "4", suit })) },
];

export function CardHierarchy() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200/15 bg-amber-200/[0.06] px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-amber-50">Da mais forte para a mais fraca</p>
          <p className="mt-0.5 text-xs text-white/50">Hierarquia do truco gaúcho</p>
        </div>
        <span className="rounded-full border border-amber-100/20 px-3 py-1 text-xs text-amber-100/75">
          ♠ espadas · ♣ paus · ♦ ouro · ♥ copas
        </span>
      </div>

      <ol className="grid gap-2 sm:grid-cols-2">
        {CARD_RANKS.map((rank, index) => (
          <li
            key={rank.name}
            className={`flex min-h-[5.5rem] items-center gap-3 rounded-xl border px-3 py-2.5 ${
              index < 4
                ? "border-amber-100/20 bg-gradient-to-r from-amber-200/[0.11] to-white/[0.03]"
                : "border-white/[0.08] bg-black/10"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">{rank.name}</p>
              <p className="text-xs text-white/45">{rank.detail}</p>
            </div>
            <div className="flex shrink-0 items-center justify-end -space-x-3" aria-label={rank.name}>
              {rank.cards.map((card) => (
                <img
                  key={`${card.value}-${card.suit}`}
                  src={`/cards/${card.value}-${card.suit}.jpg`}
                  alt={`${card.value} de ${card.suit}`}
                  title={`${card.value} de ${card.suit}`}
                  loading="lazy"
                  className="hierarchy-card-thumb"
                />
              ))}
            </div>
          </li>
        ))}
      </ol>

      <p className="rounded-xl border border-emerald-100/10 bg-emerald-950/30 px-4 py-3 text-sm leading-6 text-emerald-50/70">
        Cartas de mesmo poder empatam. Na mesa, as cartas empatadas se anulam; se as
        maiores empatarem, vence a carta mais forte que sobrar. Se todas empatarem,
        ninguém leva a vaza.
      </p>
    </div>
  );
}
