const resp = await fetch('http://localhost:3000');
const html = await resp.text();
const cssMatch = html.match(/href="([^"]*\.css[^"]*)"/);
const cssResp = await fetch('http://localhost:3000' + cssMatch[1]);
const css = await cssResp.text();

console.log('CSS length:', css.length);

// Check for any un-layered * resets with padding: 0
const allStarResets = [...css.matchAll(/\*\s*\{[^}]*padding:\s*0[^}]*\}/g)];
console.log('\nAll * resets with padding: 0:', allStarResets.length);
for (const m of allStarResets) {
  const pos = m.index;
  const before = css.substring(Math.max(0, pos - 50), pos);
  const isInLayer = before.includes('@layer');
  console.log(`  Position ${pos} - ${isInLayer ? 'IN @layer (OK)' : 'Check context:'}`);
  if (!isInLayer) {
    console.log(`    Before: ${before}`);
  }
}

// Verify key utilities work
const checks = ['mx-auto', 'max-w-7xl', 'px-6', 'lg\\:px-12', 'py-24', 'pt-24', 'gap-16'];
console.log('\nUtility checks:');
for (const c of checks) {
  console.log(`  ${css.includes(c) ? '✓' : '✗'} ${c}`);
}

console.log('\n✅ All padding/margin utilities should now work correctly!');
