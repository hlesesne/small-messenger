# iMessage-Style ChatGPT PWA

A Progressive Web App that replicates the visual and interactive style of iMessage while providing a seamless interface to ChatGPT. 

## Features

- **Authentic iMessage UI**: Blue/gray chat bubbles, timestamps, and familiar iOS design language
- **ChatGPT Integration**: Real-time conversations with OpenAI's GPT models
- **Markdown Support**: Code formatting, lists, and styled text rendering
- **Persistent Conversations**: Maintain context across sessions with local storage
- **Mobile Optimized**: Responsive design for iOS and Android devices
- **PWA Capabilities**: Install as a native app with offline support
- **Privacy Focused**: API keys stored locally, no data sharing

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Add OpenAI API Key**
   - Open the app in your browser
   - Enter your OpenAI API key when prompted
   - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

4. **Build for Production**
   ```bash
   npm run build
   ```

## Usage

- **New Conversation**: Tap the back button to start fresh
- **Send Messages**: Type and press Enter or tap the send button
- **Markdown**: Use standard markdown for formatting
- **Mobile Install**: Use your browser's "Add to Home Screen" option

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **PWA** with service worker and manifest
- **React Markdown** for rich text rendering
- **OpenAI API** for ChatGPT integration
- **CSS3** with native iOS design patterns

## Privacy & Security

- All API keys are stored locally in your browser
- No conversations or data are sent to external servers
- Direct communication with OpenAI's API only
- No tracking or analytics

## Browser Compatibility

- Modern browsers supporting ES2020+
- iOS Safari (recommended for authentic experience)
- Chrome/Edge on Android
- Progressive enhancement for older browsers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on mobile devices
5. Submit a pull request

## License

MIT License - feel free to use this code for personal or commercial projects.