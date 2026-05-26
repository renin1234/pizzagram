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

export const categoryLabels: Record<Category, string> = {
  pizza: "Пицца",
  snacks: "Закуски",
  drinks: "Напитки",
};

export const categoryOrder: Category[] = ["pizza", "snacks", "drinks"];
