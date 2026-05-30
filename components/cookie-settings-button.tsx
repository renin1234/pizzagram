"use client";

type Props = { variant?: "prominent" };

export default function CookieSettingsButton({ variant }: Props = {}) {
  const handleClick = () => {
    try {
      localStorage.removeItem("pizzagram-cookies-v1");
    } catch {}
    window.dispatchEvent(new Event("pizzagram:show-cookie-banner"));
  };

  if (variant === "prominent") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-2 border-2 border-ink bg-cream px-5 py-3 font-display uppercase tracking-widest text-sm hover:bg-ink hover:text-cream transition-colors cursor-pointer shadow-[4px_4px_0_var(--ink)]"
      >
        Отозвать согласие и выбрать заново
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="py-1 text-cream/60 hover:text-crimson text-xs cursor-pointer"
    >
      Настройки cookies
    </button>
  );
}
