const esbuild = require('esbuild');
const fs = require('fs-extra');
const path = require('path');
const { glob } = require('glob');

const packageJson = require('../package.json');

const external = Object.keys(packageJson.dependencies || {});
const servicesDir = path.join(__dirname, '../src/services');
const outDir = path.join(__dirname, '../dist-electron/services');

async function build() {
  try {
    console.log('Building Electron services...');

    // Clean the output directory
    await fs.emptyDir(outDir);

    // Find all .ts files recursively in the services directory
    const entryPoints = await glob('**/*.ts', { cwd: servicesDir, absolute: true });

    // Build with esbuild
    await esbuild.build({
      entryPoints: [
        ...entryPoints
      ],
      outdir: outDir,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      sourcemap: 'inline',
      tsconfig: path.join(__dirname, '../tsconfig.json'),
      outExtension: { '.js': '.cjs' },
      external,
    });

    console.log('Electron services built successfully.');
  } catch (error) {
    console.error('Error building Electron services:', error);
    process.exit(1);
  }
}

build();