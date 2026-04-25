import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

// Update title with project count
const title = document.querySelector('.projects-title');
if (title) {
  title.textContent = `Projects (${projects.length})`;
}

const container = document.querySelector('.projects');
renderProjects(projects, container, 'h2');