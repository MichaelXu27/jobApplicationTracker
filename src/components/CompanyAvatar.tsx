/**
 * Deterministic colored avatar for a company name.
 * Picks color based on company name initial, so the same company
 * always gets the same color across renders.
 */

const PALETTES = [
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-pink-100", text: "text-pink-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
];

interface CompanyAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

export default function CompanyAvatar({ name, size = "md" }: CompanyAvatarProps) {
  const code = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const { bg, text } = PALETTES[code % PALETTES.length];

  const sizeClass =
    size === "sm"
      ? "w-8 h-8 text-xs rounded-xl"
      : size === "lg"
      ? "w-12 h-12 text-base rounded-2xl"
      : "w-10 h-10 text-sm rounded-xl";

  return (
    <div
      className={`${sizeClass} ${bg} ${text} flex items-center justify-center font-bold shrink-0`}
    >
      {name.trim()[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
