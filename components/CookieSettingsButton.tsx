"use client";

export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("ibr:open-cookie-settings"))}
      className="font-medium text-purple-700 hover:underline"
    >
      Cookie settings
    </button>
  );
}
