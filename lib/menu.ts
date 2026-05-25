import menuJson from "../data/menu.json";

export type Category = "pizza" | "snacks" | "drinks";

export type MenuItem = {
  id: string;
  category: Category;
  name: string;
  ingredients: string;
  sizes: { label: string; price: number }[];
  image: string;
  badge?: "ХИТ" | "НОВОЕ" | "ВЕГ" | "ОСТРОЕ" | "−20%";
  feature?: boolean;
  /** Per-photo zoom override (default 1.4). Lower = wider crop, higher = tighter. */
  imgScale?: number;
  /** If true, item is hidden on the public menu (admin can toggle). */
  hidden?: boolean;
};

/**
 * Public menu — items with hidden:true are excluded.
 * Data comes from data/menu.json (editable via admin panel).
 * In production: requires `npm run build` + redeploy (data is bundled at build time).
 * In development: HMR picks up changes automatically.
 */
export const menu: MenuItem[] = (menuJson as unknown as MenuItem[]).filter(
  (item) => !item.hidden
);

export const categoryLabels: Record<Category, string> = {
  pizza: "Пицца",
  snacks: "Закуски",
  drinks: "Напитки",
};

export const categoryOrder: Category[] = ["pizza", "snacks", "drinks"];
