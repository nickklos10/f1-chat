# F1GPT - Formula 1 AI Assistant

A specialized Formula 1 racing chat application built with Next.js, React, and Tailwind CSS. This project uses Retrieval Augmented Generation (RAG) to provide accurate, context-aware responses about Formula 1 racing.

## Features

- Modern Formula 1 themed UI with chat interface
- Advanced RAG implementation with real-time semantic search
- Chat session management (create, rename, delete conversations)
- Responsive design optimized for all devices
- Dark/light mode toggle with proper theming
- Real-time streaming responses from OpenAI models
- Typing indicators and animations for a polished experience
- Vector search with AstraDB for context retrieval
- Formula 1 specific content and knowledge tuning

## Tech Stack

### Frontend

- **Next.js 15** with App Router and Edge Runtime
- **React 19** with latest Hooks implementation
- **Tailwind CSS 4** for styling
- **TypeScript** for type safety
- **Shadcn/UI** components for consistent design

### AI & Backend

- **OpenAI's AI SDK** (`@ai-sdk/openai`) for API integration
- **Vercel AI SDK** for streaming responses
- **LangChain** for document loading and text splitting
- **Vector Embeddings** using OpenAI's text-embedding-3-small model
- **AstraDB** Vector Database for efficient similarity search
- **RAG Architecture** for contextual, accurate responses
- **Edge Runtime** for optimal performance

### Data Integration

- **Web Scraping** pipeline using Puppeteer via LangChain
- **Text Processing** with RecursiveCharacterTextSplitter
- **Vector Search** for semantic similarity retrieval
- **Local Storage** for persisting chat sessions

## How it Works

1. **Data Ingestion**: Formula 1 content is scraped from authoritative sources, chunked, and stored with embeddings in AstraDB
2. **Query Processing**: User questions are converted to embeddings for vector search
3. **Context Retrieval**: Semantic search in AstraDB finds the most relevant Formula 1 information
4. **Response Generation**: OpenAI models generate responses enhanced with retrieved context
5. **UI Integration**: Streamed responses are displayed with typing indicators and Markdown formatting

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file with the following variables:

```
ASTRA_DB_NAMESPACE=your_namespace
ASTRA_DB_COLLECTION=your_collection
ASTRA_DB_API_ENDPOINT=your_endpoint
ASTRA_DB_APPLICATION_TOKEN=your_token
OPENAI_API_KEY=your_openai_key
```

4. Seed the database with Formula 1 data (optional):

```bash
npm run seed
```

5. Run the development server:

```bash
npm run dev
```

6. Open [F1GPT](https://f1-chat-lilac.vercel.app/) with your browser to see the result.

## RAG Implementation Details

The application uses a custom Retrieval Augmented Generation pipeline:

1. **Embeddings**: Formula 1 content is converted to vector embeddings using OpenAI's text-embedding-3-small model
2. **Vector Storage**: Embeddings are stored in AstraDB for efficient similarity search
3. **Context Retrieval**: User queries are embedded and used to find the most relevant content
4. **Prompt Engineering**: Retrieved content is injected into a carefully crafted system prompt
5. **Response Generation**: OpenAI's gpt-4o-mini model generates responses using the enriched context

## Usage

- Type a message related to Formula 1 in the input field
- Use suggestion buttons for quick Formula 1 topic prompts
- Create new chat sessions using the sidebar
- Rename or delete chat sessions as needed
- Toggle between light and dark mode with the theme button
- Clear the conversation with the trash button
