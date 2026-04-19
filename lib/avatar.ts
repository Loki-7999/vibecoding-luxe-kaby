export function getAvatarInitials(displayName: string) {
  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");
}

export function getAvatarFallbackDataUrl(displayName: string) {
  const initials = getAvatarInitials(displayName) || "?";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none">
      <rect width="96" height="96" rx="48" fill="#DDEDE8"/>
      <circle cx="48" cy="48" r="46" fill="#ECF6F2" stroke="#0E7468" stroke-width="2"/>
      <text
        x="50%"
        y="50%"
        text-anchor="middle"
        dominant-baseline="central"
        font-family="Arial, Helvetica, sans-serif"
        font-size="34"
        font-weight="700"
        fill="#0E3B35"
      >
        ${initials}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function getAvatarSrc(avatarUrl: string | null | undefined, displayName: string) {
  return avatarUrl || getAvatarFallbackDataUrl(displayName);
}
