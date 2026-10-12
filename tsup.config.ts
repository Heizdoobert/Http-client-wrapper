const config = {
  entry: {
    index: 'src/index.ts',
    client: 'src/client/index.ts',
    server: 'src/server/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  // package.json points at .mjs/.cjs; tsup's default for cjs would be .js.
  outExtension: ({ format }: { format: string }) => ({ js: format === 'cjs' ? '.cjs' : '.mjs' }),
};

export default config;
