export default function MarqueeBanner() {
  const items = [
    "SPIN THE WHEEL TODO",
    "BEAT THE TIMER",
    "EARN POINTS",
    "NO ZERO DAYS",
    "BUILD YOUR STREAK",
    "DOUBLE ATTEMPT RULE",
    "PERFECT DAY BONUS +50",
  ];

  const fullText = items.join(" • ") + " • ";

  return (
    <div
      className="w-full bg-carbon text-paper-white border-y border-carbon overflow-hidden select-none py-1.5"
      aria-hidden="true"
    >
      <div className="animate-marquee whitespace-nowrap text-[12px] font-bold tracking-[0.032em] uppercase">
        <span className="mx-2">{fullText}</span>
        <span className="mx-2">{fullText}</span>
        <span className="mx-2">{fullText}</span>
        <span className="mx-2">{fullText}</span>
      </div>
    </div>
  );
}
