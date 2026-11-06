# abdullah-al-faahim.github.io

Personal portfolio of Abdullah Al Fahim: Broadcast Operations Engineer at Channel i, brand identity designer and builder of small tools for Bangladesh.

Live at **https://abdullah-al-faahim.github.io**

Plain HTML, CSS and a little JavaScript, served by GitHub Pages from `main`. No build step: edit and push.

| Path | Page |
|---|---|
| `/` (`index.html`) | The whole site: about, experience, design work, apps, clients, recognition and toolbox. Styles, scripts and images in `showcase/`. |
| `/cv/` | Latest CV as a PDF, with page previews in `cv/preview/`. |
| `/showcase/` | Old address, redirects to `/`. |
| `/clients/` | Client logos for the home page strip (empty until you add some). |

## Adding a client logo

Upload a PNG, SVG, WebP or JPG to the `clients/` folder (on GitHub: open the folder, then **Add file > Upload files**). A GitHub Action (`.github/workflows/clients.yml`) then adds it to `clients/clients.json`, and the home page shows it within a minute or two. No code to edit.

- The file name becomes the logo's label: `NUSDF Bangladesh.png` shows as "NUSDF Bangladesh".
- Use a transparent or white background; logos sit on white cards.
- For a white logo, put `white` in the file name, e.g. `Utopia SoftTech (white).png`. It gets a dark card and the word is left out of the label.
- A file named like a built-in logo replaces it (Channel i, Laptop World BD, FarhanasBrainstation).

- Colors and type follow the profile design system: one violet scale on `#3A10AD`, Acid Lime `#D4FF24` as the only highlight, Sora and JetBrains Mono (SIL Open Font License, see `assets/fonts/`).
- Light and dark themes follow the visitor's system setting; the toggle in the header overrides it.
- Preview locally: `python -m http.server 8000`, then open http://localhost:8000.
