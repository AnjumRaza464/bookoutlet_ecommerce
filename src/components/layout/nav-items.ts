export type NavItem = { label: string; href: string; children?: { label: string; href: string }[] };

export function buildNav(boards: { name: string; slug: string }[]): NavItem[] {
  return [
    { label: "Home", href: "/" },
    {
      label: "Matric",
      href: "/books?level=MATRIC",
      children: [
        { label: "Class 9", href: "/books?class=9" },
        { label: "Class 10", href: "/books?class=10" },
      ],
    },
    {
      label: "Intermediate",
      href: "/books?level=INTERMEDIATE",
      children: [
        { label: "1st Year (11)", href: "/books?class=11" },
        { label: "2nd Year (12)", href: "/books?class=12" },
      ],
    },
    { label: "Textbooks", href: "/books?category=textbooks" },
    { label: "Guides", href: "/books?category=guides-and-keybooks" },
    { label: "Notes", href: "/books?category=notes" },
    { label: "Past Papers", href: "/books?category=past-papers" },
    {
      label: "Boards",
      href: "/boards",
      children: boards.map((b) => ({ label: b.name, href: `/books?board=${b.slug}` })),
    },
    { label: "Track Order", href: "/track" },
    { label: "Contact", href: "/contact" },
  ];
}
