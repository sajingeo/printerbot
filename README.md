# printerbot 🎂🖨️

Party games for a Bluetooth thermal printer, built for **Andy's Birthday Bash**.
A tablet sits on the bar, anyone walks up, taps, and the printer spits out a ticket.

**Play it:** https://sajingeo.github.io/printerbot/

The printer driver is `web/js/printer.js`, copied from
[blethermal](https://github.com/sajingeo/blethermal) (AH-M2 / XenGro mini printer over Web Bluetooth).

## Games

| Game | Status | What it does |
|---|---|---|
| 🍻 **Do or Drink** | live | Tap **Dare me**, a dare shuffles in and prints. Do it, or drink the sips on the ticket. 1 in 10 pulls is a wild card. |
| 👑 **Which Andy Are You?** | live | A fake vibe scan, then you get your Andy type (Garden Queen Andy, Hot Sauce Andy, Dog Mom Andy…) with a superpower, weakness, tonight's mission, and Charlie or Farley as sidekick. |
| 🖍️ **I Was Here!** | live | Type your name, get a colour-in sticker: bubble-outlined "<Name> was here!" with outlined doodles. Pick a tagline and a doodle theme (Party, Spicy, Doggo, Garden, Royal). Every sticker is a fixed 3.5 cm to save paper. Colour it in and stick it on the Bar. |

Do or Drink is a kiosk: no players, no scores. The screen resets 25 s after a dare,
or when someone taps **Done**. Guests pick the heat: 🧊 Chill, 😏 Flirty, 🌶️ Spicy,
or 🎲 Surprise me (all three). Dares don't repeat until a level runs out.
Edit the dares in `web/js/games/dares.js`, the Andy types in
`web/js/games/andy-types.js`, and the sticker taglines in `web/js/games/name-sticker.js`.
All games are kiosks: no players, no scores.

## Party setup

1. Use **Chrome on an Android tablet**. iPads need the Bluefy browser, since Safari
   has no Web Bluetooth.
2. Open https://sajingeo.github.io/printerbot/. Web Bluetooth needs HTTPS (or `localhost`), so a
   plain `http://<laptop-ip>:8000` from the tablet won't connect to the printer.
3. Turn the printer on, tap **🖨️ Connect printer**, pick `AH-M2`.
4. Tap ⚙️ → **Test print**. Adjust **Darkness** if needed.
5. Tap ⛶ for full screen. The page keeps the screen awake while it's open.

If the printer drops, the pill turns yellow again; tap it to reconnect. Without a
printer the game still works on screen.

## Files

* `web/index.html` – the whole site: game hub plus each game as a view. One page,
  because a Web Bluetooth connection dies when the browser navigates.
* `web/js/party-printer.js` – shared connection, settings, and canvas → dots
  (text thresholded, emoji outlined and dithered).
* `web/js/ticket.js` – ticket layout (text, rows, rules) and the shared party header.
* `web/js/games/` – one module per game.
* `web/js/fx.js` – confetti, sounds, toasts.

## Develop

```bash
npm run serve          # http://localhost:8000
npm test               # game data tests
npm run sync-printer   # re-copy printer.js from ../blethermal
```

Pushing to `main` runs the tests and deploys `web/` to GitHub Pages.
