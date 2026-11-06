# abdullah-al-faahim.github.io

Personal portfolio of Abdullah Al Fahim: Broadcast Operations Engineer at Channel i, brand identity designer and builder of small tools for Bangladesh.

Live at **https://abdullah-al-faahim.github.io**

Plain HTML, CSS and a little JavaScript, served by GitHub Pages from `main`. No build step: edit and push.

| Path | Page |
|---|---|
| `/` (`index.html`) | The whole site: about, experience, design work, apps, clients, recognition and toolbox. Styles, scripts and images in `showcase/`. |
| `/cv/` | Latest CV as a PDF, with page previews in `cv/preview/`. |
| `/showcase/` | Old address, redirects to `/`. |
| `/blog/` | Blog home and one page per post, built from `content/blog/*.md` by `tools/build_blog.py`. |
| `/admin/` | Private blog editor (Sveltia CMS). Only accounts with write access to this repo can sign in. |
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

## Writing a blog post

**In the editor (recommended).** Open https://abdullah-al-faahim.github.io/admin/ and sign in:

- *Sign In Using Access Token*: paste a GitHub fine-grained personal access token limited to this repository, with **Contents: Read and write**. The token stays in your browser; nobody else can publish without their own write access.
- *Work with Local Repository* (Chrome or Edge on a computer): pick your local clone of this repo, then commit and push yourself.

Then **Blog posts > New Blog post**: title, publish date, topic, a short summary, a cover image (16:9, e.g. 1600 × 900), tags, and the post itself in the rich text editor. Tick **Draft** to save without publishing. **Save** commits the post to `content/blog/`, and the **Build blog** Action rebuilds `/blog/`, the RSS feed, the sitemap and the home page's "From the blog" section about a minute later.

**By hand.** Add `content/blog/<slug>.md` with front matter like the existing posts (`title`, `date`, `category`, `excerpt`, `cover`, `cover_alt`, `tags`, `draft`) and push. Topics: `broadcast`, `apps`, `design-systems`, `brand`, `research`, `leadership`, `ai`. To build locally: `pip install markdown pyyaml`, then `python tools/build_blog.py`.
