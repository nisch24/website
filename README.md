# Personal Portfolio — GitHub Pages

A simple, markdown-based personal website built with Jekyll and deployed on GitHub Pages.

## How to Deploy

1. **Create a GitHub repository** named `<your-username>.github.io`

2. **Update the site with your info:**
   - Replace all instances of `Your Name`, `your-username`, `your-profile`, and
     `your.email@example.com` with your real information.
   - Edit `_config.yml` and set the `url` field to `https://<your-username>.github.io`.

3. **Push the files:**
   ```bash
   cd github-portfolio
   git init
   git remote add origin https://github.com/<your-username>/<your-username>.github.io.git
   git add .
   git commit -m "Initial portfolio site"
   git branch -M main
   git push -u origin main
   ```

4. **Enable GitHub Pages:**
   - Go to your repository → **Settings** → **Pages**
   - Under **Source**, select the `main` branch and click **Save**
   - Your site will be live at `https://<your-username>.github.io` within a few minutes.

## Structure

```
github-portfolio/
├── _config.yml      # Jekyll configuration
├── index.md         # Home page
├── projects.md      # Detailed project descriptions
└── README.md        # This file (excluded from the site build)
```

## Adding Pages

Create any new `.md` file with Jekyll front matter at the top:

```markdown
---
layout: default
title: Page Title
---

Your content here...
```

It will automatically be available at `/<filename>` on your site.

## Local Preview (optional)

```bash
gem install bundler jekyll
bundle init
bundle add jekyll github-pages
bundle exec jekyll serve
```

Then visit `http://localhost:4000`.
