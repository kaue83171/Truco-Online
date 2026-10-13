import { useEffect, useState } from "react";
import { BookOpen, Layers, X } from "lucide-react";
import { CardHierarchy } from "./CardHierarchy";

type HelpTab = "rules" | "hierarchy";

type TutorialModalProps = {
  open: boolean;
  onClose: () => void;
  initialTab?: HelpTab;
};

export function TutorialModal({
  open,
  onClose,
  initialTab = "rules",
}: TutorialModalProps) {
  const [activeTab, setActiveTab] = useState<HelpTab>(initialTab);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [initialTab, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="help-backdrop fixed inset-0 z-50 grid place-items-center p-3 sm:p-6"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-help-title"
        className="help-modal max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl p-4 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-amber-200/70">
              guia da mesa
            </p>
            <h2 id="game-help-title" className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
              Ajuda para jogar
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 text-white/75 transition hover:border-amber-200/35 hover:bg-white/10 hover:text-white"
            title="Fechar ajuda"
            aria-label="Fechar ajuda"
          >
            <X size={19} />
          </button>
        </div>

        <div className="help-tabs mb-5 grid grid-cols-2 gap-2 rounded-xl p-1.5" role="tablist" aria-label="Conteúdo da ajuda">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "rules"}
            onClick={() => setActiveTab("rules")}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              activeTab === "rules"
                ? "bg-amber-200 text-[#2d1c12] shadow-md"
                : "text-white/60 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <BookOpen size={17} /> Como jogar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "hierarchy"}
            onClick={() => setActiveTab("hierarchy")}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              activeTab === "hierarchy"
                ? "bg-amber-200 text-[#2d1c12] shadow-md"
                : "text-white/60 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <Layers size={17} /> Hierarquia das cartas
          </button>
        </div>

        {activeTab === "hierarchy" ? (
          <CardHierarchy />
        ) : (
          <div className="grid gap-3 text-sm leading-6 text-white/75 sm:grid-cols-2">
            <article className="help-rule-card">
              <span className="help-rule-number">01</span>
              <div>
                <h3 className="font-semibold text-white">Vidas e objetivo</h3>
                <p className="mt-1">
                  Antes da partida, o anfitrião escolhe 3 ou 5 vidas. Quem errar o
                  palpite perde uma vida. Os dois últimos jogadores vivos vencem.
                </p>
              </div>
            </article>
            <article className="help-rule-card">
              <span className="help-rule-number">02</span>
              <div>
                <h3 className="font-semibold text-white">Primeira rodada: testa</h3>
                <p className="mt-1">
                  Cada um recebe uma carta na testa. Você não vê a sua, mas vê as dos
                  outros. Todos dizem “eu faço” ou “eu não faço”; não há regra de soma.
                </p>
              </div>
            </article>
            <article className="help-rule-card">
              <span className="help-rule-number">03</span>
              <div>
                <h3 className="font-semibold text-white">Palpites das rodadas</h3>
                <p className="mt-1">
                  A partir de 2 cartas, cada pessoa vê a própria mão e canta quantas
                  vazas fará. O último a cantar não pode escolher o número que fecharia a soma\n                  das cartas da rodada. Se a soma já chegou a esse número, deve cantar\n                  pelo menos 1.
                </p>
              </div>
            </article>
            <article className="help-rule-card">
              <span className="help-rule-number">04</span>
              <div>
                <h3 className="font-semibold text-white">Cartas e empate</h3>
                <p className="mt-1">
                  Joguem seguindo a hierarquia do truco gaúcho. Cartas de mesmo poder
                  se anulam; se todas empatarem, ninguém ganha a vaza.
                </p>
              </div>
            </article>
            <p className="rounded-xl border border-amber-100/10 bg-amber-100/[0.04] px-4 py-3 text-xs leading-5 text-amber-50/60 sm:col-span-2">
              Quando o baralho não permitir distribuir mais cartas a todos, a sequência
              recomeça com uma carta por jogador.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
