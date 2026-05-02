import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

// Update title with project count
const title = document.querySelector('.projects-title');
if (title) {
    title.textContent = `${projects.length} Projects`;
}

const container = document.querySelector('.projects');
renderProjects(projects, container, 'h2');


// --- State ---
let query = '';
let selectedYear = null;

// --- Helper: get filtered projects ---
function getFilteredProjects() {
  return projects.filter(p => {
    const text = Object.values(p).join(' ').toLowerCase();
    const matchesSearch = text.includes(query.toLowerCase());
    const matchesYear = selectedYear === null || p.year === selectedYear;
    return matchesSearch && matchesYear;
  });
}

// --- Helper: get pie chart data ---
function getPieData(filteredProjects) {
  const rolled = d3.rollups(
    filteredProjects,
    v => v.length,
    d => d.year
  );
  return rolled.map(([year, count]) => ({ label: year, value: count }));
}

// --- Render pie chart ---
function renderPie(projectsForPie) {
  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');

  // Clear previous chart
  svg.selectAll('*').remove();
  legend.html('');

  // Pie data
  const data = getPieData(projectsForPie);

  // Arc generator
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const pieGenerator = d3.pie().value(d => d.value);
  const arcs = pieGenerator(data);

  // Draw slices
  arcs.forEach((arc, i) => {
    svg.append('path')
      .attr('d', arcGenerator(arc))
      .attr('fill', colors(data[i].label))
      .attr('class', selectedYear === data[i].label ? 'selected' : '')
      .style('cursor', 'pointer')
      .on('click', () => {
        selectedYear = selectedYear === data[i].label ? null : data[i].label;
        update();
      });
  });

  // Draw legend
  data.forEach((d, i) => {
    legend.append('li')
      .attr('style', `--color:${colors(d.label)}`)
      .attr('class', selectedYear === d.label ? 'selected' : '')
      .html(`<span class="swatch"></span> ${d.label} (${d.value})`)
      .on('click', () => {
        selectedYear = selectedYear === d.label ? null : d.label;
        update();
      });
  });
}

// --- Update function ---
function update() {
  const filteredProjects = getFilteredProjects();
  renderProjects(filteredProjects, container, 'h2');
  renderPie(filteredProjects);
}

// --- Search input ---
const searchInput = document.querySelector('.searchBar');
searchInput?.addEventListener('input', e => {
  query = e.target.value;
  update();
});

// --- Initial render ---
update();