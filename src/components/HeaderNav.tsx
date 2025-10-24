import { GenerationIcon, LibraryIcon, EyeIcon } from "./icons/HeaderIcons";

export function HeaderNav() {
  const navLinks = [
    { href: "/generate", text: "Generuj fiszki", icon: <GenerationIcon /> },
    { href: "/flashcards", text: "Moje fiszki", icon: <LibraryIcon /> },
    { href: "/session", text: "Sesja nauki", icon: <EyeIcon /> },
  ];

  return (
    <nav className="hidden md:flex items-center gap-4">
      {navLinks.map(({ href, text, icon }) => (
        <a
          key={href}
          href={href}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {icon}
          {text}
        </a>
      ))}
    </nav>
  );
}
