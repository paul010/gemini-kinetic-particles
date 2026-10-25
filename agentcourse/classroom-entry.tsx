import React from 'react';
import { createRoot } from 'react-dom/client';
import AgentCourse from './AgentCourse';
createRoot(document.getElementById('root')!).render(<AgentCourse onHome={() => { window.location.href = 'https://dailycosmos.net'; }} relatedUrl="https://dailycosmos.net/copilot-demo" />);
