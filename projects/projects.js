import * as d3 from 'https://jsdelivr.net';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const title = document.querySelector('.projects-title');
if (title) {
  title.textContent = `${projects.length} Projects`;
}

const container = document.querySelector('.projects');
renderProjects(projects, container, 'h2');

// STATE
let query = '';
let selectedYear = null;

// FILTER FUNCTION
function getFilteredProjects() {
  return projects.filter(p => {
    let text = Object.values(p).join(' ').toLowerCase();
    let matchesSearch = text.includes(query.toLowerCase());
    let matchesYear = selectedYear === null || p.year === selectedYear;
    return matchesSearch && matchesYear;
  });
}

// PIE RENDER
const allYears = [...new Set(projects.map(p => p.year))];
const colors = d3.scaleOrdinal(d3.schemeTableau10).domain(allYears);

function renderPie(projectsData) {
  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');

  svg.selectAll('path').remove();
  legend.html('');

  // 1. Group the FULL list so slices don't resize or disappear
  const rolled = d3.rollups(projects, v => v.length, d => d.year);
  const data = rolled.map(([year, count]) => ({ label: year, value: count }));

  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const arcs = d3.pie().value(d => d.value)(data).map(d => arcGenerator(d));

  // 2. Draw slices with conditional opacity
  arcs.forEach((arc, i) => {
    const year = data[i].label;
    // Check if this year actually exists in our search results
    const isPresent = projectsData.some(p => p.year === year);

    svg.append('path')
      .attr('d', arc)
      .attr('fill', colors(year))
      .attr('class', selectedYear === year ? 'selected' : '')
      .style('opacity', isPresent ? 1 : 0.1)
      .style('pointer-events', isPresent ? 'auto' : 'none')
      .on('click', () => {
        selectedYear = selectedYear === year ? null : year;
        update();
      });
  });

  // 3. Draw legend with same logic
  data.forEach((d, i) => {
    const isPresent = projectsData.some(p => p.year === d.label);

    legend.append('li')
      .attr('style', `--color:${colors(d.label)}`)
      .attr('class', selectedYear === d.label ? 'selected' : '')
      .style('opacity', isPresent ? 1 : 0.1)
      .style('pointer-events', isPresent ? 'auto' : 'none')
      .html(`<span class="swatch"></span> ${d.label} (${d.value})`)
      .on('click', () => {
        selectedYear = selectedYear === d.label ? null : d.label;
        update();
      });
  });
}

// SEARCH
const searchInput = document.querySelector('.searchBar');
searchInput?.addEventListener('input', e => {
  query = e.target.value;
  update();
});

// UPDATE
function update() {
  const filtered = getFilteredProjects();
  renderProjects(filtered, container, 'h2');
  
  // Pass the filtered projects to determine what is "active" 
  // while the chart stays built on the full list.
  renderPie(filtered);
}

// initial render
update();
