# Gemini Academy

**Transform educational lesson plans into engaging multimedia presentations powered by AI**
Gemini Academy is an AI-powered educational content generator that takes structured lesson plans and automatically creates rich, interactive presentations with narrated audio, contextual images, video introductions, and comprehension quizzes.
![A Teacher](plans/teacher_sample.png)
---

## Features

- **🎙️ AI Narration**: Generate natural-sounding audio narration using Gemini TTS
- **🖼️ Contextual Images**: Create theme-appropriate images for each slide topic
- **🎬 Video Introductions**: Generate personalized video introductions from your photo
- **📝 Interactive Quizzes**: Automatically generate multiple-choice questions from content
- **📱 Responsive Design**: Beautiful, mobile-friendly interface with smooth slide transitions
- **☁️ Cloud Publishing**: Export presentations as standalone HTML files hosted on Firebase
- **✅ Content Validation**: Ensures all lecture content is complete before generation

---

## Architecture

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling (via CDN)
- **react-markdown** for markdown parsing and rendering

### AI Services (Gemini API)
- **gemini-2.5-flash-image**: Image generation
- **gemini-2.5-flash-preview-tts**: Text-to-speech narration
- **veo-3.1-fast-generate-preview**: Video generation
- **gemini-2.5-flash**: Quiz generation with structured output
- **gemini consumer**: Fully planned and concepted in the Gemini Consumer Voice Mode
- **gemini ai studio**: 80% built in AI Studio's vibe coding tools
- **gemini CLI**: Most of the rest vibed in gemini CLI

### Storage
- **Firebase Storage**: Media files (audio, images, video)
- **Firebase Hosting**: Published lecture presentations

---

## Setup Instructions

### Prerequisites
- **Node.js** (v18 or higher)
- **pnpm** (v10.18.0 or higher)
- **Gemini API Key** ([Get one here](https://ai.google.dev/gemini-api/docs/api-key))
- **Firebase Account** (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gemini-academy
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure Firebase**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Firebase Storage and Hosting
   - Update `firebaseService.ts` with your Firebase config

4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open the app**
   - Navigate to `http://localhost:5173`
   - Click "Connect API Key" and enter your Gemini API key

---

## Usage

### 1. Generate a Lecture

**Using Default Content:**
- Click "Generate Lecture" to use the default lesson plan (The World in 1750)

**Using Custom Content:**
- Upload a custom lesson plan JSON file (see Data Schema below)
- Optionally upload a personal photo for the video introduction
- Click "Generate Lecture"

### 2. Navigate the Presentation

- Use arrow buttons or keyboard arrows to navigate slides
- Intro slide features auto-playing video
- Content slides have synchronized audio narration
- Quiz slides provide instant feedback

### 3. Publish the Lecture

- Click "Publish Lecture" to generate a standalone HTML file
- The file is uploaded to Firebase Storage
- Share the generated URL with students

---

## Data Schema

Lecture plans must follow this JSON schema:

```json
{
  "grade": 10,
  "unit_title": "Lesson Title",
  "lecture_id": "optional-id",
  "overview": "Brief description of the lesson",
  "guiding_questions": [
    "Key question 1?",
    "Key question 2?"
  ],
  "content_and_themes": [
    {
      "theme": "Main Topic",
      "details": [
        "First paragraph with **markdown** support",
        "Second paragraph with *emphasis*",
        "* Bullet point 1",
        "* Bullet point 2"
      ]
    }
  ]
}
```

### Schema Details

#### ContentAndTheme
- **`theme`** (string): The slide title/topic
- **`details`** (string[]): Array of content paragraphs/points
  - Each string is a separate paragraph
  - Supports markdown: `**bold**`, `*italic*`, `# headers`, `* lists`
  - **Cannot be empty** - validation enforced at load time

#### Validation Rules
1. All `details` arrays must contain at least one non-empty string
2. Each detail string must have meaningful content (not just whitespace)
3. Invalid plans will show specific error messages indicating which themes are empty

---

## Project Structure

```
gemini-academy/
├── components/
│   ├── Slide.tsx           # Content slide component
│   ├── QuizSlide.tsx       # Quiz slide component
│   ├── Spinner.tsx         # Loading spinner
│   └── IconComponents.tsx  # SVG icons
├── services/
│   ├── geminiService.ts    # Gemini API integration
│   └── firebaseService.ts  # Firebase storage/hosting
├── data/
│   ├── grades/             # Sample lesson plans
│   └── lecture.schema.yml  # OpenAPI schema definition
├── types.ts                # TypeScript interfaces
├── utils.ts                # Helper functions
├── App.tsx                 # Main application
└── firebase.json           # Firebase configuration
```

---

## Recent Improvements

### Markdown Handling & Schema Compliance
**Problem**: Empty content appearing next to images in slides due to:
- Inconsistent data format (string vs. array)
- Weak markdown parsing
- No validation for empty content

**Solution**:
1. **Corrected Schema Compliance**: Updated TypeScript types to match OpenAPI schema where `theme.details` is `string[]`
2. **Replaced Custom Parser**: Switched from custom `markdownToHtml()` to `react-markdown` library for robust parsing
3. **Added Validation**: Lectures with empty `details` arrays are rejected at load time with descriptive error messages
4. **Fallback Handling**: Both React components and published HTML show "No content available" for edge cases

**Files Changed**:
- `types.ts`: Updated `ContentAndTheme.details` to `string[]`
- `components/Slide.tsx`: Now uses `react-markdown` with empty content fallback
- `App.tsx`: Added validation logic, joins arrays before rendering
- `utils.ts`: Improved `markdownToHtml()` to handle empty content

---

## Technologies Used

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.8.2 |
| Build Tool | Vite | 6.2.0 |
| AI Platform | Google Gemini | @google/genai 1.29.0 |
| Storage | Firebase | 12.5.0 |
| Markdown | react-markdown | 10.1.0 |
| Package Manager | pnpm | 10.18.0 |

---

## Deployment

### Build for Production
```bash
pnpm build
```

### Deploy to Firebase
```bash
pnpm deploy
```

This command:
1. Builds the production bundle
2. Deploys to Firebase Hosting (`gemini-academy-teacher`)

---

## API Costs

**Note**: This application uses paid Gemini APIs. Typical costs per lecture generation:

- **Video Generation (Veo)**: ~$0.10-0.30 per video
- **Image Generation**: ~$0.01-0.05 per image (4-6 images/lecture)
- **Audio Generation (TTS)**: ~$0.01-0.03 per slide
- **Quiz Generation**: Minimal (<$0.01)

**Estimated total**: $0.20-0.50 per complete lecture

See [Gemini API Pricing](https://ai.google.dev/pricing) for current rates.

---

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

---

## License

This project was created as part of the Gemini API development program.
