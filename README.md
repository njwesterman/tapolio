# Tapolio - Live AI Copilot

A real-time AI assistant that listens to your technical questions via speech recognition and provides instant answers.

## Features

- 🎤 **Speech Recognition**: Uses Web Speech API for continuous listening
- 🤖 **AI-Powered Answers**: Leverages OpenAI GPT-4o-mini for technical responses
- 📝 **Conversation History**: Tracks all questions and answers
- ⚡ **Real-time Processing**: Instant AI suggestions as you speak
- 🔒 **Rate Limited**: Built-in protection against API abuse

## Project Structure

```
tapolio/
├── tapolio-server/     # Express backend
│   ├── index.js        # Main server file
│   ├── package.json
│   ├── .env            # Environment variables (not in git)
│   └── .env.example    # Template for environment setup
└── tapolio-web/        # Ionic React frontend
    ├── src/
    │   ├── pages/      # Home page component
    │   ├── hooks/      # Speech recognition hook
    │   └── services/   # API service
    └── package.json
```

## Getting Started

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd tapolio-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from template:
   ```bash
   cp .env.example .env
   ```

4. Add your OpenAI API key to `.env`:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   PORT=4000
   ```

5. Start the server:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the web directory:
   ```bash
   cd tapolio-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to the URL shown (usually `http://localhost:5173`)

## Usage

1. Click "Start Listening" to begin speech recognition
2. Ask a technical question (must end with "?")
3. The AI will respond with a concise answer
4. Your conversation history is displayed below
5. Click "Reset" to clear the conversation

## Browser Compatibility

Speech recognition requires:
- Chrome 25+
- Edge 79+
- Safari 14.1+ (macOS)

## API Endpoints

- `POST /suggest` - Get AI suggestion for a transcript
- `GET /health` - Health check endpoint
- `POST /reset` - Clear conversation history

## Environment Variables

### Server
- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `PORT` - Server port (default: 4000)

### Web
- `VITE_API_BASE_URL` - Backend URL (default: http://localhost:4000)

## Security Notes

- Never commit `.env` files to version control
- The `.env` file is protected by `.gitignore`
- Rate limiting is enabled (20 requests per minute per IP)
- Input validation prevents excessively long transcripts

## License

ISC
