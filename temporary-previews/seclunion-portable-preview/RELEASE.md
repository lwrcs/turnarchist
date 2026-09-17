# Autumn preview — 2026-09-17

Built from the current local Seclunion client. Includes the current character assets, two individual deciduous birch types, four flower patches, four pumpkins, ground 4x model upscale, normal/depth maps, day-dependent atmosphere and shared foliage gusts.

Production build and 17 environment/contact/grass tests passed. Local browser checked. The generated foundation is not pixel-identical to the original; visual tuning is still needed. Existing prop placement data is preserved. Broader maple/oak variants remain draft assets and are not included.

Entry PIN is a casual client-side playtest gate, not secure authentication. This static deployment has no authoritative editor write API; edits use existing browser-local fallback. Local development retains the write API.

Ground upscale: 4x-ClearRealityV1_Soft, no diffusion. Normal maps: DSINE OpenGL +Y, preserved sprite alpha. Ground maps regenerated at 1254 square after correcting a no-alpha mask fallback. Ground diffuse is 5016 square.
