# crt

webgpu crt shader overlay for svelte. captures the dom and processes it through a physically-parameterised crt pipeline — scanlines, shadow mask, bloom psf, halation, chromatic aberration, ghosting, barrel distortion.

## stack

- svelte 5 + vite
- three.js webgpu renderer + tsl (node-based shader system)
- html2canvas for dom capture

## running

```bash
bun install
bun run dev
```

## building

```bash
bun run build
```

## shader pipeline

1. barrel distortion
2. chromatic aberration (radial + vertical)
3. color bleed
4. shadow mask (rgb triad with slot, brick offsets, lod)
5. bloom psf (3-component soft-knee gaussian: core / mid / halo)
6. halation (warm wide blur)
7. vignette
8. ghosting (frame persistence)
9. scanlines (physical beam model with animated scan speed)
10. edge mask

## controls

43 uniforms across 5 sections: intensity / bloom / beam / mask / optics. all live-adjustable via the panel.
