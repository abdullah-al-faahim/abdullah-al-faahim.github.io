# abdullah-al-faahim.github.io

Personal portfolio of Abdullah Al Fahim: Broadcast Operations Engineer at Channel i, brand identity designer and builder of small tools for Bangladesh.

Live at **https://abdullah-al-faahim.github.io**

Plain HTML, CSS and a little JavaScript, served by GitHub Pages from `main`. No build step: edit and push.

| Path | Page |
|---|---|
| `/` (`index.html`) | Home: design work from Behance and Dribbble, and the apps live on this domain. Styles, scripts and images in `showcase/`. |
| `/resume/` | Résumé: experience, projects, recognition and toolbox. |
| `/cv/` | Latest CV as a PDF, linked from both pages. |
| `/showcase/` | Old address, redirects to `/`. |
| `/clients/` | Client logos for the home page strip (empty until you add some). |

## Adding a client logo

Upload a PNG, SVG, WebP or JPG to the `clients/` folder (on GitHub: open the folder, then **Add file > Upload files**). The home page picks it up on its own, no code to edit.

- The file name becomes the logo's label: `NUSDF Bangladesh.png` shows as "NUSDF Bangladesh".
- Use a transparent or white background; logos sit on white cards.
- A file named like a built-in logo replaces it (Channel i, Laptop World BD, FarhanasBrainstation).

- Colors and type follow the profile design system: one violet scale on `#3A10AD`, Acid Lime `#D4FF24` as the only highlight, Sora and JetBrains Mono (SIL Open Font License, see `assets/fonts/`).
- Light and dark themes follow the visitor's system setting; the toggle in the header overrides it.
- Preview locally: `python -m http.server 8000`, then open http://localhost:8000.
