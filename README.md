# Do It Yar — the paper garage

Website for **Do It Yar (DIY)**: 15 papercraft car kits, a walk-through paper garage, a multiplayer
Paper Grand Prix and a lot of easter eggs. Plain HTML, CSS and JavaScript (GSAP, Lenis, PeerJS from CDNs),
so there is no build step.

## Pages

| Path | What it is |
| --- | --- |
| `/index.html` | Home: the paper dream, the bedroom launch, flat-to-folded, the car showroom, arcade, club |
| `/store/index.html` | Shop: showroom carousel + filterable grid of all 15 kits |
| `/cars/automobiles/index.html` | The paper garage: loading-dock bays, offers, bundle builder, quiz, spec lab |
| `/products/<car>/index.html` | One page per car: photos, walk-around, what's inside, combos |
| `/race/index.html` | Paper Grand Prix: vs bot, same screen, or online with a friend |

Car data lives in one place: `assets/js/data.js`.

## Run it locally

Any static server works. On Windows there is a tiny one included:

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1 -Port 8080
```

Then open http://localhost:8080.

## Deploy on Vercel

1. Import this GitHub repository in Vercel (**Add New → Project**).
2. Framework preset: **Other**. Leave the build command and output directory empty.
3. Deploy. `vercel.json` adds caching and security headers; `404.html` is the not-found page.

## Pre-launch leads (the "Buy now" / "Checkout" pop-up)

Sales are not live yet, so buying opens a notify-me form (name, phone, email). Both that form and the
footer's **Join the club** form send through [Web3Forms](https://docs.web3forms.com/getting-started/api-reference),
using the destination inbox's existing public form key in `LEADS_KEY` in `assets/js/core.js`.
The destination is `chat.priyanshuag@gmail.com`; `LEADS_TO` supplies the direct-email fallback.
The public form key is intended for browser use. No Gmail password or server secret belongs in this code.

- A success message appears only after the email API accepts the submission. Each request times out after 15 seconds.
- Failures keep the form filled and offer direct email. Unsent entries are retained in browser storage when available,
  retried when the connection returns or the visitor submits again, and removed after acceptance. Repeated retries of
  the same entry are deduplicated locally. This is a delivery queue, not a mailing-list database or an autoresponder.
- If moving to a different inbox, create a public Web3Forms key for that inbox and update both constants.
  If the key has a domain restriction, include the production domain `artdiy.vercel.app`.

## Sound

Every car has a real engine recording (trimmed and levelled) in `assets/sound/`, plus paper, zipper, garage door,
party-popper and firecracker effects. Recordings are CC0, CC BY or CC BY-SA. The full list with authors is in the site footer
under **Sound credits** and in `assets/js/data.js`. Stand-in recordings (same engine family, not the exact car) are
marked as such.
The footer tear celebration uses synthesized paper noise, pops and confetti fizz, so it contains no vocals.

## Credits

Designed and printed by Do It Yar.
