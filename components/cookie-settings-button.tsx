"use client";

export default function CookieSettingsButton() {
  const handleClick = () => {
    try {
      localStorage.removeItem("pizzagram-cookies-v1");
    } catch {}
    window.dispatchEvent(new Event("pizzagram:show-cookie-banner"));
  };

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
