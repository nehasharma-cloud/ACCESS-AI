# ACCESS-AI

## AI-Powered Accessibility Assistant

Making the visual world more accessible.

---

## About The Project

ACCESS-AI is an AI-powered accessibility assistant designed
for people with low vision and blind users.

It uses a phone camera or uploaded image to understand
visual information and provide the result as text or voice.

The project focuses on personalized accessibility instead
of providing only a basic image description.

---

## Main Features

### 1. Scene Description

The AI describes important objects, people, surroundings
and visible information in an image.

---

### 2. Read Text / OCR

The system can read visible text from images.

Examples:

- Signs
- Labels
- Menus
- Documents
- Posters
- Product packaging

---

### 3. Ask About Image

Users can ask questions about the uploaded image.

Example:

"What is written on the board?"

"Where is the door?"

"What object is on the table?"

---

### 4. What Matters?

This feature focuses on the most useful information
instead of describing every small detail.

It can prioritize:

- Signs
- Doors
- Stairs
- Vehicles
- Labels
- Important objects

---

### 5. Blind / Voice-First Mode

Blind users can receive AI results through
text-to-speech.

The system can automatically read the AI response aloud.

---

### 6. Low-Vision Mode

Low-vision users can receive descriptions focused on:

- Important objects
- Readable text
- Relative positions
- Useful visual information

---

### 7. English and Hindi

The system supports:

- English
- Hindi

Both text responses and voice output can use
the selected language.

---

### 8. Camera Support

Users can capture an image directly using
their device camera.

---

### 9. Scan History

Recent AI scans are stored locally in SQLite
so users can review previous results.

---

## What Makes ACCESS-AI Different?

The project is not presented as a replacement for
smart glasses, mobility aids or human assistance.

Instead, it is designed as a flexible software assistant
that works with a device many users already have.

The main differentiation is the combination of:

- Personalized accessibility profile
- Blind voice-first mode
- Low-vision mode
- OCR
- Scene understanding
- Ask About Image
- What Matters? prioritization
- Hindi + English support
- Scan history
- Accessibility-focused interaction

---

## Technology Stack

### Frontend

- HTML
- CSS
- JavaScript

### Backend

- Python
- Flask

### AI

- Vision-capable AI model through API

### Database

- SQLite

### Browser APIs

- Camera API
- Speech Synthesis API

---

## Project Structure

ACCESS-AI/

    app.py

    requirements.txt

    .env.example

    .gitignore

    README.md

    access_ai.db

    uploads/

        .gitkeep

    templates/

        index.html

    static/

        style.css

        script.js

---

## Installation

### Step 1: Open the project

Open the ACCESS-AI folder in VS Code.

---

### Step 2: Open Terminal

In VS Code:

Terminal → New Terminal

---

### Step 3: Create Virtual Environment

Run:

    python -m venv .venv

---

### Step 4: Activate Virtual Environment

Windows PowerShell:

    .venv\Scripts\Activate.ps1

If PowerShell blocks the command, you can use:

    .venv\Scripts\activate

---

### Step 5: Install Requirements

Run:

    pip install -r requirements.txt

---

## API Configuration

Create a file named:

    .env

Copy the contents of `.env.example` into it.

Then add your API key:

    OPENAI_API_KEY=YOUR_API_KEY_HERE

Set `OPENAI_MODEL` to a vision-capable model currently
available to your API account.

---

## Run The Project

Run:

    python app.py

You should see something similar to:

    * Running on http://127.0.0.1:5000

Open the address in your browser.

---

## Demo Flow

### Demo 1: Scene Description

1. Open ACCESS-AI
2. Upload an image
3. Select Scene Description
4. Click Analyze
5. AI describes the image

---

### Demo 2: Read Text

1. Upload a poster/document/sign
2. Select Read Text
3. Click Analyze
4. The AI extracts visible text

---

### Demo 3: Ask About Image

1. Upload an image
2. Enter a question
3. Click Ask About Image
4. AI answers using visible information

---

### Demo 4: What Matters?

1. Upload an image
2. Select What Matters?
3. Click Analyze
4. AI focuses on useful visible information

---

### Demo 5: Blind Mode

1. Select Blind / Voice-First
2. Upload or capture an image
3. Analyze
4. The result is automatically spoken aloud

---

## Accessibility

ACCESS-AI is designed with accessibility in mind.

The interface aims to provide:

- Large buttons
- Clear labels
- Voice output
- Keyboard interaction
- Simple language
- High readability
- Hindi support

---

## Important Limitation

ACCESS-AI uses AI image understanding.

AI can sometimes make mistakes.

Therefore the system should not be treated as:

- A replacement for a mobility aid
- A replacement for a human assistant
- A medical diagnosis system
- A safety-critical navigation system

Users should verify important information when necessary.

---

## Future Scope

Possible future improvements include:

- Offline AI processing
- Mobile application
- Wearable integration
- Smart-glasses integration
- Better OCR
- Voice commands
- Personalized user profiles
- More Indian languages
- Object detection
- Edge AI
- Emergency assistance integration
- Haptic feedback
- Accessibility analytics

---

## Hackathon Pitch

ACCESS-AI is an AI-powered accessibility assistant
that helps blind and low-vision users understand
their surroundings through a device they already use.

Instead of giving only a generic image description,
the system provides personalized accessibility modes,
OCR, question-based image understanding,
important-information prioritization and voice-first interaction.

The goal is to make visual information easier to access
while keeping the user and existing accessibility aids
in the loop.

---

## License

This project is created as a hackathon prototype.