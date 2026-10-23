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

Sales are not live yet, so buying opens a notify-me form (name, phone, email). Submissions go through
[FormSubmit](https://formsubmit.co), which emails each lead, with the cars in the visitor's bag, to the
address in `LEADS_TO` in `assets/js/core.js`.

- The **first** submission makes FormSubmit send that inbox a one-time *Activate form* email. Click it once
  and every lead after that arrives automatically.
- After activating, FormSubmit also emails you a random alias. Put that alias in `LEADS_TO` instead of the
  plain address, so the address is not visible in the page source.

## Sound

Every car has a real engine recording (trimmed and levelled) in `assets/sound/`, plus paper, zipper, garage door,
party-popper and firecracker effects. All are CC0, CC BY or CC BY-SA. The full list with authors is in the site footer
under **Sound credits** and in `assets/js/data.js`. Stand-in recordings (same engine family, not the exact car) are
marked as such.

## Credits

Papercraft car designs by Wong Hidayat (Wongday). Physical DIY kits by Do It Yar.
