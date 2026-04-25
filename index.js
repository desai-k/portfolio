// Show first 3 projects on homepage
import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

const projects = await fetchJSON('./lib/projects.json');

if (projects) {
  const latestProjects = projects.slice(0, 3);
  const container = document.querySelector('.projects');
  renderProjects(latestProjects, container, 'h2');
}

// Display GitHub stats
const githubData = await fetchGitHubData('desai-k');

const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
  profileStats.innerHTML = `
    <dl>
      <dt>Public Repos:</dt><dd>${githubData.public_repos}</dd>
      <dt>Followers:</dt><dd>${githubData.followers}</dd>
      <dt>Following:</dt><dd>${githubData.following}</dd>
      <dt>Public Gists:</dt><dd>${githubData.public_gists}</dd>
    </dl>
  `;
}
