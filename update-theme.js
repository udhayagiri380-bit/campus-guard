const fs = require('fs');

let css = fs.readFileSync('styles.css', 'utf8');

// Replace dark rgba backgrounds (e.g., rgba(10, 15, 28, 0.88), rgba(0,0,0,0.5))
// We'll target rgba() where the first three values are less than 60 (dark).
css = css.replace(/rgba\(\s*([0-5]?[0-9])\s*,\s*([0-5]?[0-9])\s*,\s*([0-5]?[0-9])\s*,\s*([0-9.]+)\s*\)/g, (match, r, g, b, a) => {
    // If alpha is high (>0.5), it's likely a panel background. Use var(--bg-panel)
    // If alpha is low (<0.5), it's likely a border or shadow.
    const alpha = parseFloat(a);
    if (alpha > 0.5) {
        return 'var(--bg-panel)';
    } else {
        return 'var(--border-strong)';
    }
});

// Replace hardcoded #fff or #ffffff text colors with var(--text-primary)
// but only when used in color: or fill:
css = css.replace(/(color|fill):\s*#(fff|ffffff|FFF|FFFFFF)\b/g, '$1: var(--text-primary)');

// Replace hardcoded #000 or black backgrounds with var(--bg-surface)
css = css.replace(/background(-color)?:\s*(#000|#000000|#0f172a|#131c2e|#070a11|#0d131f|black)\b/gi, 'background$1: var(--bg-surface)');

// Fix specific known components
css = css.replace(/background:\s*radial-gradient\(circle,\s*#0e1e38 0%,\s*#070e1b 100%\);/gi, 'background: var(--bg-surface-elevated);');

fs.writeFileSync('styles.css', css);
console.log('CSS theme updated!');
