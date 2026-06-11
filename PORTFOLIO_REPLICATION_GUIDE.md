# Portfolio Replication Guide

Use this guide to recreate this portfolio style for another person using their CV, resume, project list, and assets.

## What This Portfolio Is

This is a single-page static portfolio built around:

- A strong AI/data science hero section.
- Scroll-based storytelling.
- Project proof cards with outcomes, tech stacks, and honest constraints.
- A featured case study PDF section.
- Interactive signal/skill maps.
- GitHub public activity signals.
- Experience, skills, education, and contact sections.

The main file is:

```text
index.html
```

The site is intentionally static, so it can run on GitHub Pages without a build step.

## Files To Replace For Another Person

Replace these assets first:

```text
phot ds.jpeg        -> profile/portrait image
resume_new.pdf      -> resume PDF
space.jpeg          -> project image 1
chatbot.jpeg        -> project image 2
urban.jpeg          -> project image 3
singapore.jpeg      -> project image 4
vision.jpeg         -> project image 5
```

Optional project SVGs:

```text
project-space.svg
project-rag.svg
project-urban.svg
project-population.svg
project-waste.svg
```

Optional case study files:

```text
aegis-evo-case-study.pdf
aegis-evo-flowchart.png
aegis-evo-flowchart-page.png
```

## Main Content To Customize

In `index.html`, update these sections:

1. Head metadata
   - `<title>`
   - description meta tag
   - author meta tag
   - Open Graph title/description/image

2. Navigation
   - Section labels if the new person has different categories.
   - LinkedIn, email, GitHub, and resume links.

3. Hero
   - Name
   - subtitle
   - short positioning statement
   - badge text
   - CTA links
   - portrait image
   - hero stats

4. About
   - Current role/status
   - short biography
   - “Currently” card

5. Signal Map
   - Project orbit names
   - skill domains
   - impact matrix rows
   - GitHub username in JavaScript

6. Case Study
   - Replace Aegis-Evo title/copy/PDF with the new person’s strongest project.
   - If no PDF exists, convert this into a featured project block instead.

7. Experience
   - Use resume/CV roles.
   - Keep descriptions outcome-focused.

8. Projects
   - Replace all five project story cards.
   - For each project, provide:
     - title
     - date/institution
     - 2-4 sentence project description
     - input/process/output terminal summary
     - proof points
     - tech tags
     - GitHub/demo links

9. Skills
   - Update skill groups and evidence.
   - Avoid listing skills with no project proof.

10. Education
   - Replace school names, dates, degree names, and map route if needed.

11. Contact
   - Email
   - LinkedIn
   - availability message
   - target roles/interests

## GitHub Activity

The current site uses public GitHub API calls in browser JavaScript.

Find this line:

```js
const githubUsername = "deepaksharma0801";
```

Replace it with the new GitHub username.

This public API can show:

- public repos
- public languages
- latest public push
- recent public events

For exact GitHub contribution calendars, use a safer workflow:

- Create a GitHub Action.
- Store a GitHub token as a repo secret.
- Query GitHub GraphQL for `contributionsCollection`.
- Write the result to a static JSON file.
- Fetch that JSON from the portfolio.

Do not put a GitHub token directly in frontend JavaScript.

## Optional Traffic Tracking

For simple privacy-friendly analytics, add Cloudflare Web Analytics in the `<head>`:

```html
<script defer src="https://static.cloudflareinsights.com/beacon.min.js"
  data-cf-beacon='{"token":"REPLACE_WITH_CLOUDFLARE_TOKEN"}'></script>
```

Replace the token after creating a Cloudflare Web Analytics site.

## Replication Workflow

1. Duplicate the project folder.
2. Replace resume, portrait, and project images.
3. Read the new CV and extract:
   - name
   - current role
   - target roles
   - education
   - experience
   - top 5 projects
   - strongest case study
   - skills with proof
4. Update metadata and links.
5. Rewrite Hero, About, Experience, Projects, Skills, Education, and Contact.
6. Replace GitHub username.
7. Preview `index.html` locally.
8. Check mobile layout.
9. Verify all links and assets.
10. Deploy to GitHub Pages.

## Writing Style

Keep the tone:

- specific
- proof-driven
- concise
- technical but readable
- honest about constraints

Avoid generic lines like:

```text
Passionate developer with strong problem-solving skills.
```

Prefer:

```text
Built a retrieval workflow that anonymizes inputs, chunks documents, and returns traceable answers through a lightweight web interface.
```

## Quick Replacement Checklist

- [ ] Name updated everywhere.
- [ ] Resume PDF replaced and linked.
- [ ] Portrait replaced.
- [ ] Email updated.
- [ ] LinkedIn updated.
- [ ] GitHub username updated.
- [ ] Hero stats updated.
- [ ] About section rewritten.
- [ ] Experience section rewritten.
- [ ] Five project cards rewritten.
- [ ] Case study section replaced or removed.
- [ ] Skills mapped to real evidence.
- [ ] Education updated.
- [ ] Contact copy updated.
- [ ] All images load.
- [ ] All links work.
- [ ] Mobile view checked.
- [ ] Metadata updated.

