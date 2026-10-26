# HABITS Lab — website

Source of the HABITS Lab website (Constructor University, Bremen), published with
GitHub Pages at **https://habits-lab-mmacedo.github.io**.

The site is built with [Jekyll](https://jekyllrb.com), which GitHub Pages runs
automatically. You don't need to install anything: edit a file, commit it, and the
site updates itself within a few minutes.

---

## Contents

1. [Publishing the site for the first time](#publishing-the-site-for-the-first-time)
2. [Where to edit what](#where-to-edit-what)
3. [Adding a person (with a GIF)](#adding-a-person-with-a-gif)
4. [Adding a news post](#adding-a-news-post)
5. [Adding a publication](#adding-a-publication)
6. [Adding a conference deadline](#adding-a-conference-deadline)
7. [Light and dark theme](#light-and-dark-theme)
8. [Previewing the site on your computer (optional)](#previewing-the-site-on-your-computer-optional)
9. [Troubleshooting](#troubleshooting)
10. [Still to do](#still-to-do)

---

## Publishing the site for the first time

### 1. Create the repository

1. Go to <https://github.com/organizations/HABITS-Lab-MMacedo/repositories/new>.
2. **Owner:** `HABITS-Lab-MMacedo`.
3. **Repository name:** exactly `habits-lab-mmacedo.github.io`.
4. Select **Public** (GitHub Pages on the free plan only works with public repositories).
5. Do **not** tick "Add a README file" — the repository must start empty.
6. Click **Create repository**.

You need to be an owner of the organisation, or have permission to create
repositories in it. If you don't, ask an owner to create the repository and give
you write access.

### 2. Upload the files

The files in this folder must sit at the **root** of the repository (not inside a
sub-folder).

**Option A — command line (recommended)**

```bash
cd path/to/habits-site
git init -b main
git add .
git commit -m "Initial lab website"
git remote add origin https://github.com/HABITS-Lab-MMacedo/habits-lab-mmacedo.github.io.git
git push -u origin main
```

**Option B — web browser**

1. On the new repository page, click **uploading an existing file**.
2. Open the `habits-site` folder, select everything inside it, and drag it onto the page.
3. Check that the folders `_data`, `_includes`, `_layouts`, `_posts` and `assets` are listed.
4. Click **Commit changes**.

### 3. Turn on GitHub Pages

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Under **Branch**, choose **main** and **/ (root)**, then click **Save**.

### 4. Check it

Open the **Actions** tab and wait for the build to turn green (1–2 minutes).
The site is then live at **https://habits-lab-mmacedo.github.io**.

---

## Where to edit what

| What | File |
|---|---|
| Lab name, description, contact email, social links, menu | `_config.yml` |
| People (photos and GIFs) | `_data/people.yml` + images in `assets/img/people/` |
| Research themes | `_data/research.yml` |
| Publications | `_data/publications.yml` |
| Conference deadlines | `_data/deadlines.yml` |
| Courses and teaching material | `_data/teaching.yml` |
| News | one Markdown file per post in `_posts/` |
| "Join us" page text | `join.md` |
| Colours and fonts | top of `assets/css/main.css` |

> **YAML tips:** indentation matters (use spaces, never tabs), and put text in
> quotes if it contains a colon `:` or starts with a special character.

---

## Adding a person (with a GIF)

1. Add the images to `assets/img/people/`:
   - `firstname.jpg` — a static photo,
   - `firstname.gif` — an optional animated version.

   Square images (e.g. 400×400 or 600×600) look best. Keep each GIF under ~2 MB.
2. In `_data/people.yml`, add an entry under the right group:

   ```yaml
   - name: First Last
     role: PhD Student
     topic: short description of the research topic
     photo: /assets/img/people/firstname.jpg
     gif: /assets/img/people/firstname.gif
     link: https://personal-website-or-google-scholar
   ```

How the GIF behaves:

- On a computer, the photo is static and the GIF plays when the mouse is over it.
- On phones and tablets (no mouse), the GIF plays automatically.
- To make every GIF play all the time, set `people_gif_mode: always` in `_config.yml`.
- If `photo` is empty, the person's initials are shown instead.

**Making a GIF:** record a 2–3 second video of the person (waving works well),
then convert it at <https://ezgif.com/video-to-gif>, cropping to a square around 400×400.

Former members go in the `alumni` list at the bottom of `people.yml` (name, a short
note and an optional link — no photo needed).

---

## Adding a news post

Create a file in `_posts/` named `YYYY-MM-DD-short-title.md`, for example
`_posts/2026-11-20-paper-accepted-icwsm.md`:

```markdown
---
title: Paper accepted at ICWSM 2027!
tags: [paper]
---

Write the post here in Markdown. The first paragraph is used as the summary
on the News page.
```

The date in the file name is the publication date. Posts appear on the News page
and the four most recent ones on the home page.

---

## Adding a publication

Add an entry to `_data/publications.yml`:

```yaml
- title: "Title of the paper"
  authors: "First Author, Mariana Macedo, Another Author"
  venue: "Applied Network Science"
  year: 2026
  type: journal          # journal | conference | preprint | workshop | thesis
  doi: "10.1007/xxxxx"   # optional
  pdf: ""                # optional: link, or a file in assets/papers/
  code: ""               # optional
  data: ""               # optional
  selected: true         # true = also show on the home page
```

Authors written exactly as in `people.yml` are highlighted automatically.
The two entries currently in the file are examples and should be replaced.

---

## Adding a conference deadline

Add an entry to `_data/deadlines.yml`:

```yaml
- name: NetSci 2027
  full: International School and Conference on Network Science
  url: https://netscisociety.net/
  location: City, Country
  area: Network Science
  conference: June 1–5, 2027
  deadlines:
    - { label: "Abstract", date: "2027-01-20" }
    - { label: "Full paper", date: "2027-01-27" }
```

- Deadlines default to **23:59 AoE** (Anywhere on Earth, UTC−12).
- For a different time zone add `time` and `tz`, e.g.
  `{ label: "Abstract", date: "2027-01-20", time: "17:00", tz: 1 }` for 17:00 CET.
- Put labels in quotes (labels with commas break otherwise).
- If the dates are not announced yet, use `deadlines: []`; the venue is listed under
  "Dates not announced yet".
- Available areas: `Network Science`, `Computational Social Science`,
  `Web & Social Media`, `HCI & Society`, `AI & Fairness`. A new area name creates
  a new filter button automatically.

Countdowns and ordering are computed in the visitor's browser, so the site does not
need rebuilding when a deadline passes.

---

## Light and dark theme

The button in the top-right corner switches between light and dark and remembers
the visitor's choice. Without a choice, the site follows the operating system
setting. Colours for both themes are defined at the top of `assets/css/main.css`.

---

## Previewing the site on your computer (optional)

Requires Ruby. Then:

```bash
gem install bundler
bundle install
bundle exec jekyll serve
```

Open <http://localhost:4000>. Changes to files reload automatically (except
`_config.yml`, which needs a restart).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| 404 at the site address | Check the repository is named exactly `habits-lab-mmacedo.github.io` and that Pages uses branch `main`, folder `/ (root)`. |
| Page shows plain text with no styling | The files were uploaded inside a `habits-site/` sub-folder. Move them to the root of the repository. |
| Change doesn't appear | Wait a few minutes and hard-refresh (Ctrl/Cmd + Shift + R). Check the **Actions** tab for a failed build. |
| Build failed (red ✗ in Actions) | Usually a YAML mistake in `_data/` (wrong indentation or a missing quote). Open the failed run to see the file and line. |
| Can't create a repository in the organisation | Ask an organisation owner for permission, or to create it for you. |

---

## Still to do

- [ ] Official meaning of the acronym HABITS and final tagline (`_config.yml`)
- [ ] Official lab / university contact email (`_config.yml`)
- [ ] Real members, photos and GIFs (`_data/people.yml`) — current entries are examples
- [ ] Real publications (`_data/publications.yml`) — current entries are examples
- [ ] Review the research theme texts with the PI (`_data/research.yml`)