import { TICKETS, type ChestReward } from "./game-state";
import { RARITY_LABEL, stickerForSlot } from "./stickers";

export type RewardItem = { key: string; label: string; highlight?: boolean };

/** ממיר פרס תיבה לרשימת פריטים לתצוגה באנימציית הפתיחה */
export function rewardItems(r: ChestReward): RewardItem[] {
  const items: RewardItem[] = [{ key: "coins", label: `🪙 ${r.coins} מטבעות` }];
  if (r.hints > 0) items.push({ key: "hints", label: `💡 ${r.hints} רמזים` });
  r.stickers.forEach((slot) => {
    const s = stickerForSlot(slot);
    items.push({
      key: `s${slot}`,
      label: `${s.emoji} ${s.name} · ${RARITY_LABEL[s.rarity]}`,
      highlight: s.rarity === "legendary",
    });
  });
  if (r.ticket)
    items.push({
      key: "ticket",
      label: `${TICKETS[r.ticket].emoji} כרטיס ${TICKETS[r.ticket].title}`,
    });
  if (r.boost === "double")
    items.push({ key: "double", label: "⏩ כפל מטבעות לשעה", highlight: true });
  if (r.boost === "premium" && !r.rarePremium)
    items.push({ key: "prem", label: "👑 פרימיום ליום", highlight: true });
  if (r.rarePremium)
    items.push({ key: "rare", label: "👑 פרימיום נדיר (1:10,000) ליום שלם!", highlight: true });
  return items;
}
