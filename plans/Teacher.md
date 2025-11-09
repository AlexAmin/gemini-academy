# Teacher Perspective: Use Cases (JSON-Driven Platform)

This document outlines the use cases for an educator using the lecture generation platform, which is driven by a pre-defined JSON content structure.

### Use Case 1: Browse Available Grades
The teacher's dashboard displays a list of all available grades (e.g., "Kindergarten," "Grade 1," "Grade 10"), which is loaded directly from the `grades.json` file in the codebase. The teacher selects the grade they are teaching.

### Use Case 2: Select a Lecture Unit
After selecting a grade, the application loads the corresponding file (e.g., `grades/10.json`) and displays a list of all available lecture units for that grade. The teacher can see the title and a brief summary of each unit and selects the one they wish to prepare.

### Use Case 3: Review and Customize the Lecture
The application loads the detailed content for the selected lecture unit (e.g., from `grades/10/TWI1750.json`). The teacher is then presented with a customization screen that is pre-populated with the content from this file. Here, they can:
*   Review the guiding questions, themes, and overview for the lecture.
*   Override or provide a specific prompt for the short introductory video.
*   Define the number of questions for the final knowledge-check quiz.
*   Select the desired tone for the AI-generated audio narration.

### Use Case 4: Generate the Final Lecture
After reviewing and customizing, the teacher clicks a "Generate Lecture" button. The system uses the (potentially customized) JSON data as the source material to create the final, interactive HTML lecture.

### Use Case 5: Upload Generated Lecture to Firebase
Once the generation process is complete, the system automatically uploads the generated `index.html` file to a designated Firebase Storage bucket. The file is named using the convention: `<grade>-<subject>-<lesson-title>.html`.

### Use Case 6: Browse and Manage Existing Lectures
The teacher's dashboard now includes a section to browse all lectures stored in Firebase Storage. This list is populated by reading the file names from the Firebase Storage bucket. For each lecture, the teacher can:
*   View its title (parsed from the kebab-case `<lesson-title>` segment of the filename).
*   Click to preview the lecture (which loads the HTML file directly from its Firebase URL).
*   Optionally, delete the lecture from Firebase Storage.
