# Contributing to TitlePerfect

Thank you for considering contributing to TitlePerfect! This document provides guidelines and instructions for contributing.

## Development Setup

Please see the [README.md](README.md) for initial setup instructions.

## Code Style

### Extension (TypeScript/React)
- Use ESLint and Prettier for code formatting
- Run `npm run format` before committing
- Run `npm run lint` to check for issues
- Follow React best practices and hooks guidelines

### Backend (Python)
- Follow PEP 8 style guidelines
- Use type hints where appropriate
- Run `black` for code formatting
- Run `flake8` for linting

## Commit Messages

Use clear and descriptive commit messages:
- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Reference issues and pull requests when relevant

Examples:
```
Add title character limit validation
Fix ASIN extraction for international Amazon sites
Update README with deployment instructions
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Pull Request Guidelines

- Provide a clear description of the changes
- Link related issues
- Include screenshots for UI changes
- Ensure all tests pass
- Update documentation as needed

## Testing

### Extension
```bash
cd extension
npm run build
# Manual testing in Chrome
```

### Backend
```bash
cd backend
pytest
```

## Reporting Bugs

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Browser version (for extension issues)
- Python version (for backend issues)

## Suggesting Features

Feature suggestions are welcome! Please:
- Check existing issues first
- Provide clear use cases
- Explain why the feature would be valuable
- Consider implementation complexity

## Questions?

Feel free to open an issue for any questions or concerns.
