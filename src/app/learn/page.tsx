import { PageShell } from "@/components/page-shell";

export default function LearnPage() {
  return (
    <div className="space-y-8">
      <PageShell
        title="Learn to play"
        description="A beginner-friendly, public guide to deck basics, turn flow, combat, and common card interactions."
      />

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Game goal</h3>
        <p className="max-w-3xl text-sm opacity-90">
          Each player starts at 20 life. You usually win by reducing your
          opponent to 0 life, or by an alternate win condition written on a
          card. You lose if you must draw from an empty deck.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">What you need</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm opacity-90">
          <li>A deck with at least 60 cards.</li>
          <li>
            Basic lands and spells (creatures, instants, sorceries, and more).
          </li>
          <li>A way to track life totals (paper, app, or dice).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Card types at a glance</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm opacity-90">
          <li>
            <span className="font-medium">Land:</span> provides mana to cast
            spells. You normally play one land per turn.
          </li>
          <li>
            <span className="font-medium">Creature:</span> attacks and blocks.
            Creatures have power/toughness.
          </li>
          <li>
            <span className="font-medium">Sorcery:</span> one-time effect,
            played on your turn during main phase.
          </li>
          <li>
            <span className="font-medium">Instant:</span> one-time effect that
            can usually be cast any time you have priority.
          </li>
          <li>
            <span className="font-medium">
              Enchantment/Artifact/Planeswalker:
            </span>{" "}
            permanents that stay on the battlefield and provide ongoing value.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Turn structure</h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm opacity-90">
          <li>Untap, upkeep, draw.</li>
          <li>Main phase: play a land, cast spells.</li>
          <li>
            Combat: declare attackers, declare blockers, deal combat damage.
          </li>
          <li>Second main phase: cast more spells if needed.</li>
          <li>End step and cleanup.</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Combat basics</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm opacity-90">
          <li>You choose which untapped creatures attack.</li>
          <li>Defender chooses blockers after attackers are declared.</li>
          <li>
            Damage is dealt based on power and toughness. If damage equals or
            exceeds toughness in a turn, that creature is destroyed.
          </li>
          <li>
            Creatures usually cannot attack or use tap abilities the turn they
            enter unless they have haste.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">The stack (simple version)</h3>
        <p className="max-w-3xl text-sm opacity-90">
          Most spells and abilities wait on the stack before resolving. Players
          can respond, and the last thing added resolves first. This means
          timing matters: you can often answer a threat before it resolves.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Deckbuilding quick tips</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm opacity-90">
          <li>Aim for a smooth mana curve so you can play cards each turn.</li>
          <li>Most decks use roughly 24 lands as a starting point.</li>
          <li>Include interaction (removal/counterplay), not just threats.</li>
          <li>Keep card copies balanced; avoid too many situational cards.</li>
          <li>
            Playtest, then tune based on what felt too slow or inconsistent.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold">Beginner checklist</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm opacity-90">
          <li>Did you play a land this turn if you had one?</li>
          <li>Can you use mana efficiently this turn?</li>
          <li>Should you attack now or keep blockers back?</li>
          <li>Do you need to hold mana for an instant-speed response?</li>
          <li>What is your plan to win in the next few turns?</li>
        </ul>
      </section>
    </div>
  );
}
