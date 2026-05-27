"use client";

export default function CookieSettingsButton() {
  const handleClick = () => {
    try {
      localStorage.removeItem("pizzagram-cookies-v1");
    } catch {}
    window.location.reload();
  };

  return (
    <button
      onClick={handleClick}
      className="py-1 text-cream/60 hover:text-crimson text-xs"
    >
      Настройки cookies
    </button>
  );
}
