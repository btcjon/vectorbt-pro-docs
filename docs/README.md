# VectorBT PRO Documentation

This is the official documentation for VectorBT PRO, built with [Docusaurus 3](https://docusaurus.io/).

## Local Development

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Build the documentation
npm run build

# Serve the built documentation
npm run serve
```

## Deployment

This site is deployed on Netlify. Any push to the main branch will trigger an automatic deployment.

### Manual Deployment

To deploy manually:

1. Build the site:
```bash
npm run build
```

2. The built static files will be in the `build` directory

3. Deploy to Netlify:
```bash
# If you have Netlify CLI installed
netlify deploy
```

## Documentation Structure

- `docs/` - Main documentation files
  - `intro.md` - General Design
  - `building-blocks.md` - Building Blocks
  - `data/` - Data-related documentation
  - `indicators/` - Indicators documentation
  - `portfolio/` - Portfolio documentation
  - `tutorials/` - Tutorial files

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 