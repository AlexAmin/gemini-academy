# APP.md: Project Definition Summary

This document provides a comprehensive overview of the Lecture Generation Platform project, its functionality, and its supporting documentation.

## 1. Project Summary

The project is a web-based platform that enables educators to generate interactive, multimedia-rich lectures from a pre-defined, structured content base. The platform is designed for two main users: teachers who create content and students who consume it.

The core workflow is as follows:

1.  **Content Foundation:** The application's content is defined by a series of JSON files (`grades.json`, `grades/<grade>.json`, etc.) that provide a structured hierarchy of grades, lecture units, and specific lecture content.

2.  **Teacher Experience:** Teachers log into a dashboard where they can browse the available curriculum by grade and lecture unit. They select a lecture, which loads its pre-defined content into a customization interface. Here, they can make minor adjustments (like writing a custom video prompt) before triggering the generation process.

3.  **Generation Process:** The system takes the structured JSON content for the selected lecture, generates the required multimedia assets (intro video, audio narration) based on that content, and assembles everything into a final HTML file.

4.  **Generation Output:** Generated media files (video, audio, images) are uploaded to a Firebase Storage bucket. The final output of the generation process is a single `index.html` file, which is also uploaded to Firebase Storage. This HTML file has all CSS embedded and contains public URLs linking to the media assets in Firebase Storage. The HTML file is named using the convention: `<grade>-<subject>-<lesson-title>.html`.

5.  **Student Experience:** Students log into their own dashboard where they can browse a library of generated lectures directly from Firebase Storage. When they select a lecture, the `index.html` content is loaded from its Firebase URL and displayed within an iframe, providing a seamless learning experience within the platform.

## 2. Directory Structure

The project's file structure is organized as follows, separating the application definition files from the structured JSON content.

```
.
├── GEMINI.md
├── Generation.md
├── Student.md
├── Teacher.md
├── grades
│   ├── 10
│   │   └── TWI1750.json
│   └── 10.json
└── grades.json
```

## 3. Documentation Files

This project uses a series of Markdown files to define its functionality from different perspectives.

*   **`Teacher.md`:** Defines the application's use cases from the perspective of the educator. It details the workflow for browsing, customizing, and generating lectures.

*   **`Student.md`:** Defines the application's use cases from the perspective of the student. It details the workflow for browsing and taking a generated lecture within the platform.

*   **`Generation.md`:** Defines the "behind-the-scenes" system processes. It details how the application takes the source JSON content and turns it into a fully assembled and stored HTML lecture.