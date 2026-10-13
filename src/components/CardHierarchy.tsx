const CARD_RANKS = [
  { name: "Ás de espadas", suits: "♠", detail: "Espadão" },
  { name: "Ás de paus", suits: "♣", detail: "Bastião" },
  { name: "7 de espadas", suits: "♠", detail: "Espadilha" },
  { name: "7 de ouro", suits: "♦", detail: "Manilha" },
  { name: "3", suits: "♠  ♣  ♦  ♥", detail: "Todos os naipes empatam" },
  { name: "2", suits: "♠  ♣  ♦  ♥", detail: "Todos os naipes empatam" },
  { name: "Ás de ouro e de copas", suits: "♦  ♥", detail: "Empatam entre si" },
  { name: "Rei (12)", suits: "♠  ♣  ♦  ♥", detail: "Todos os naipes empatam" },
  { name: "Cavalo (11)", suits: "♠  ♣  ♦  ♥", detail: "Todos os naipes empatam" },
  { name: "Valete (10)", suits: "♠  ♣  ♦  ♥", detail: "Todos os naipes empatam" },
  { name: "7 de paus e de copas", suits: "♣  ♥", detail: "Empatam entre si" },
  { name: "6", suits: "♠  ♣  ♦  ♥", detail: "Todos os naipes empatam" },
  { name: "5", suits: "♠  ♣  ♦  ♥", detail: "Todos os naipes empatam" },
  { name: "4", suits: "♠  ♣  ♦  ♥", detail: "A menor carta" },
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
        {CARD_RANKS.map((card, index) => (
          <li
            key={card.name}
            className={`flex min-h-[4.25rem] items-center gap-3 rounded-xl border px-3 py-2.5 ${
              index < 4
                ? "border-amber-100/20 bg-gradient-to-r from-amber-200/[0.11] to-white/[0.03]"
                : "border-white/[0.08] bg-black/10"
            }`}
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold ${
                index < 4 ? "bg-amber-200 text-[#2d1c12]" : "bg-white/10 text-white/65"
              }`}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">{card.name}</p>
              <p className="text-xs text-white/45">{card.detail}</p>
            </div>
            <span className="shrink-0 font-display text-lg tracking-[0.08em] text-amber-100/80">
              {card.suits}
            </span>
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
