# Life Quest product showcase

`/life-quest` is an independent product page, linked from the first work card
on the existing homepage. It does not replace the AB-731 project or the Kindle
spotlight. The firmware source repository remains private. The community link
points to the existing play 802 and serves its approved release, not an
unapproved update.

## Images and copy

The four October 1 physical-device photos were supplied by the owner for
promotion. The birthday was visibly masked before distribution; all WebP files
are metadata-free, full 900 × 1200 derivatives of the privacy-safe gallery.
Screen values and task states are demonstration data, not personal age or
proof of real-world activity. The separate generated pixel-art cover is labeled
as an AI gameplay illustration, not a physical photograph or device screenshot.

Photos show installed Chinese 1.3 UI. New build 1.3.1 was submitted as revision
1741 on October 1 and is pending review; public revision 1696 remains approved.
No device installation is performed by this website update. XP, LT, planned
age and population references are explained separately; no model connection,
lifespan prediction, personal ranking or purchase availability is promised.

The page inherits the site's fonts, palette, language storage and themes. It
adds only user-initiated gallery changes, static sections, short controls and
optional disclosures. Loading and failed-image states keep the image bounds.

## Verification

- `npm run build`: passed.
- `npm run test:life-quest`: routing, project isolation, privacy/copy boundaries
  and all five metadata-free 3:4 image files passed.
- `node scripts/test-video-feed.mjs`: existing video-feed regression passed.
- Browser checks covered desktop and 390px mobile layout, English/Simplified/
  Traditional Chinese, both themes, gallery switching, homepage navigation,
  reduced-motion scrolling and a deliberately blocked image with recovery.
- Local Lighthouse mobile snapshot: Performance 90, Accessibility 100,
  Best Practices 77, SEO 100; CLS 0 and TBT 0. LCP was 3.3 seconds under the
  audit's throttling, not a production speed guarantee. Existing site-wide ads,
  fonts and shared assets account for remaining audit findings.
- Full `tsc --noEmit` is not clean: the unchanged existing
  `farmer/FarmerRiver.tsx:370` accesses `color` on `Material | Material[]`.
  No new Life Quest type error was reported. This unrelated module was not edited.

Browser/Lighthouse checks do not establish physical-button, audio or timed
sleep acceptance of the firmware.
