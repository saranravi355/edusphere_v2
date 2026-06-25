const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const targetDir = path.join(__dirname, 'src');

walkDir(targetDir, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    if (filePath.includes('lib\\prisma.ts') || filePath.includes('lib/prisma.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    
    let modified = false;

    // Replace import
    if (content.includes('import { PrismaClient } from "@prisma/client";')) {
      content = content.replace(
        'import { PrismaClient } from "@prisma/client";',
        'import prisma from "@/lib/prisma";'
      );
      modified = true;
    } else if (content.includes("import { PrismaClient } from '@prisma/client';")) {
      content = content.replace(
        "import { PrismaClient } from '@prisma/client';",
        'import prisma from "@/lib/prisma";'
      );
      modified = true;
    }

    // Remove const prisma = new PrismaClient();
    if (content.includes('const prisma = new PrismaClient();')) {
      content = content.replace('const prisma = new PrismaClient();', '');
      modified = true;
    }
    
    // In case there's another format
    if (content.includes('const prisma = new PrismaClient()')) {
      content = content.replace('const prisma = new PrismaClient()', '');
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
