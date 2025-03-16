# Publishing Instructions

1. Create a new directory on your local machine:
```bash
mkdir amazon-ads-mcp
cd amazon-ads-mcp
```

2. Copy these files maintaining the same structure:

```
amazon-ads-mcp/
├── server/         # Copy all .js, .d.ts, and .map files from dist/server/
│   ├── mcp/
│   │   └── index.js
│   ├── middleware/
│   │   └── auth.js
│   ├── db.js
│   ├── index.js
│   ├── routes.js
│   ├── storage.js
│   └── vite.js
├── shared/        # Copy all .js, .d.ts, and .map files from dist/shared/
│   └── schema.js
├── package.json   # Copy from dist/package.json
├── README.md      # Copy from dist/README.md
└── claude-desktop-config.example.json  # Copy from root

Note: Make sure to include all .d.ts (TypeScript definitions) and .map (source maps) files as well.
```

3. Once copied, from the amazon-ads-mcp directory:
```bash
npm login  # Login to your npm account
npm publish  # Publish the package
```

The package will be published as `amazon-ads-mcp` under your npm username (amekala).
