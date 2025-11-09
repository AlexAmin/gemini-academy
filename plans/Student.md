# Student Perspective: Use Cases (JSON-Driven Platform)

This document outlines the use cases for a student interacting with the learning platform.

### Use Case 1: Access the Learning Portal
The student logs into the main student dashboard, which serves as the central portal for all their courses.

### Use Case 1: Access the Learning Portal
The student logs into the main student dashboard. The dashboard presents a clean, simple interface.

### Use Case 2: Browse and View a Lecture
The primary feature on the dashboard is a browsing interface for available lectures. The workflow is as follows:
1.  The student dashboard connects to Firebase Storage to retrieve a list of available lecture `index.html` files from `gs://gemini-vibeathon.firebasestorage.app/lectures`.
2.  The list is presented to the student, showing lecture titles (parsed from the kebab-case `<lesson-title>` segment of the filenames).
3.  Upon selecting a lecture, the application loads the corresponding `index.html` file directly from its Firebase Storage URL into an inline frame (`<iframe>`) within the student's dashboard.

Because the HTML file links to all its media assets (video, audio) on public cloud URLs, the lecture can be viewed from anywhere without needing any other files. The student can navigate through the lecture using its "Next" and "Previous" buttons.

### Dashboard Design Philosophy
The student dashboard must be visually distinct from the more functional teacher dashboard. The design should be:
*   **Visually Appealing:** Use colors, fonts, and imagery that are engaging and appealing to young students.
*   **Simple:** The interface should be extremely simple, with the main focus being the file upload component.
*   **Easy to Start:** The process of uploading and starting a lecture should be quick and intuitive, requiring minimal clicks.
