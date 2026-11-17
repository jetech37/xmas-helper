# Santa's Little Helper 🎅

An all-in-one Christmas web app. No accounts, no database, works offline, installs to a phone's home screen.

## Features
- **Home:** countdown to Christmas, 24-door advent calendar (doors unlock each December day), Nice List star meter.
- **Gifts:** wish lists with "most wanted" stars and share links, gift idea finder (age, interest, budget), White Elephant gift ideas.
- **Exchange:** Secret Santa (exclusions for couples or siblings, private link per player, or pass the phone) and White Elephant / Yankee Swap (turn order, gift board, steal limits).
- **Santa:** Christmas Eve tracker that follows midnight around the world (with a sped-up preview), letters to Santa with personalised replies, and a mailbox.
- **Elf Scout:** kid-safe "Have you checked...?" questions that quietly double as setup ideas for parents, plus a "found the elf" badge.
- **Grown-Up Corner** (locked by a grown-up math question): elf planner for Dec 1 to 24 with tonight's setup and props list, gift shopping and budget tracker, Santa's Desk (write letters "from Santa" that show up in the kids' mailbox), backup and restore.

## Putting it online (free)
It's plain static files, so any static host works. It must be served over **https** for install and offline support.

- **Netlify Drop:** go to app.netlify.com/drop and drag this folder in.
- **GitHub Pages:** push the folder to a repo, then Settings > Pages > deploy from the main branch.
- **Cloudflare Pages / Vercel:** create a project from the folder, no build step.

Then on a phone: **iPhone** Safari > Share > Add to Home Screen. **Android** Chrome > menu > Install app.

When you change files later, bump `CACHE` in `sw.js` (e.g. `slh-v2`) so installed copies update.

## Live at xmashelper.com (GitHub Pages)

The `CNAME` file tells GitHub Pages the domain. To connect it:

1. Repo **Settings > Pages**: Source **Deploy from a branch**, branch `main`, folder `/ (root)`. Custom domain: `xmashelper.com`.
2. At GoDaddy (**My Products > xmashelper.com > DNS**):
   - Delete the existing `A` records for `@` (GoDaddy's parking page) and turn off any **Forwarding**.
   - Add four `A` records, name `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Optional, for IPv6: four `AAAA` records, name `@`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME` record, name `www`, value `jetech37.github.io` (replace GoDaddy's existing `www` record).
3. Back in Settings > Pages, once the DNS check passes, tick **Enforce HTTPS** (the certificate can take up to an hour). Install and offline support need https.

## How sharing works without a server
Share links carry their data in the part of the link after `#`, lightly scrambled so a kid glancing at a Secret Santa link can't read the name. The data never goes to a server. Everything else is saved in the browser on that device; use Grown-Up Corner > Settings > Backup to move it.

## Files
- `index.html`: layout and styles
- `js/logic.js`: draws, share links, tracker, Santa replies (tested)
- `js/data.js`: gift ideas, advent activities, elf ideas, Santa's route, reply wording (edit freely)
- `js/app.js`: screens and interactions
- `sw.js`, `manifest.webmanifest`, `icons/`: install and offline support
- `tests/logic.test.js`: run with `node tests/logic.test.js`
