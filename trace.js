const fs = require('fs');
const lines = fs.readFileSync('src/components/layout/TopNav.tsx', 'utf8').split('\n');
let depth = 0;
lines.forEach((l, i) => {
  const opens = (l.match(/<div/g) || []).length;
  const closes = (l.match(/<\/div>/g) || []).length;
  depth += opens - closes;
  if (opens !== closes) {
    console.log(`Line ${i+1}: +${opens} -${closes} => Depth ${depth}`);
  }
});
