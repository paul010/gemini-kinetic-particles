
Goal:

Use AI to efficiently manage tasks, PDFs, spreadsheets, APIs, and other structured data by leveraging Inngest workflows and Context Engineering for streamlined task execution.

Instructions:
	1.	Context Gathering (Inngest Workflow):
	•	Fetch & Aggregate Data: Use Inngest workflows to retrieve relevant data from PDFs, spreadsheets, APIs, or databases in parallel.
	•	Error Handling: Automatically handle retries, errors, and API rate limits.
	•	Rank & Filter: Rank and filter incoming data based on relevance, prioritizing only the most pertinent information for AI reasoning.
	2.	Context Augmentation:
	•	Structured Input: Compress and structure gathered context, making it suitable for AI processing.
	•	Specialized Models: When needed, apply specialized models (e.g., summarizers, fact-checkers, classifiers) to ensure data integrity and precision.
	•	Reliable Context: Provide the AI with a structured, reliable context rather than a single, unstructured prompt to ensure accurate responses.
	3.	AI Query Example:

const context = await inngest.workflow('task-gather-context');  // Gather context

const aiResponse = await aiAgent.ask(
  'List all tasks due this week from the Q4 report PDF',  // Specific AI query
  context  // Pass in structured context
);

console.log(aiResponse);  // Output AI response

Additional Notes:
	•	Ensure that retry logic is applied to handle any failures in fetching data.
	•	Use data filtering to reduce unnecessary data processing, ensuring the context is as relevant as possible.
	•	Consider data sanitization (e.g., removing unnecessary columns from spreadsheets) before feeding into AI systems.
