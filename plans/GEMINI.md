# Project Definition: Modular Learning App Generator

This document outlines the functional definition of a system designed to generate standalone, interactive learning applications from a curriculum.

## Part 1: The Educator's Tool

This is the interface where an educator creates the learning apps.

### Functional Requirements:

1.  **Curriculum Ingestion:** The system must be able to accept a curriculum in a raw text format.

2.  **Automated Analysis:** Upon receiving the text, the system will automatically analyze it to identify and structure the following hierarchy:
    *   Subjects (e.g., "Geography," "Science")
    *   Grade Levels within each subject (e.g., "Grade 2," "Grade 3")
    *   Topics within each grade level (e.g., "The Continents," "Photosynthesis")

3.  **Guided Selection:** The system will present a simple, step-by-step interface for the educator to:
    *   First, select a subject from the list of those identified.
    *   Second, select a grade level from the list available for that subject.
    *   Third, select a specific topic from the list taught at that grade level.

4.  **Generation Trigger:** After selecting a topic, the educator can initiate a process to generate a complete, self-contained "Student Learning App" dedicated to that topic.

## Part 2: The Generated Student Learning App

This describes the features and behavior of the application that is generated for the student.

### Functional Requirements:

1.  **Factual Grounding:** All educational content generated for the app, including texts, audio scripts, and the basis for video content, must be fact-checked against web search results to ensure accuracy and currency.

2.  **Modular Design:** The app will have a clean, modern, and professional appearance that is fully responsive, ensuring it works correctly on desktops, tablets, and smartphones.

3.  **Dynamic Chapter Structure:** The learning content for the topic will be automatically divided into a logical sequence of 5 to 10 distinct chapters or sections. The system will determine the optimal number of chapters based on the topic's complexity to ensure clarity.

4.  **Rich Content Blocks:** Each chapter will be constructed from a series of modular content blocks, which can include:
    *   **Text Blocks:** For headlines and descriptive paragraphs.
    *   **Image Blocks:** For generated illustrations with captions.
    *   **Audio Blocks:** An AI-generated narrator voice that explains a specific concept.
    *   **Video Blocks:** Short, AI-generated video clips that provide visual context (e.g., a video of a historical location for a history lesson, or an animation of a cellular process for a biology lesson).
    *   **Interactive Blocks:** Simple quizzes, such as multiple-choice or free-text questions, to reinforce learning.

5.  **User Navigation:** The student must have clear and simple controls to navigate between the chapters or sections of the learning app (e.g., "Next" and "Previous" buttons).

6.  **Learning Atmosphere:** The application may include optional, unobtrusive background music to enhance the learning experience.
