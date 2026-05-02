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

// STATE
let query = '';
let selectedYear = null;

// FILTER FUNCTION
function getFilteredProjects() {
  return projects.filter(p => {
    const matchesQuery = Object.values(p).join(' ').toLowerCase()
                          .includes(query.toLowerCase());
    const matchesYear = selectedYear === null || p.year === selectedYear;
    return matchesQuery && matchesYear;
  });
}

function update() {
  const filtered = getFilteredProjects();
  renderProjects(filtered, container, 'h2');
  renderPie(filtered); // re-render pie chart for currently visible projects
}

// PIE RENDER
const allYears = [...new Set(projects.map(p => p.year))];

const colors = d3.scaleOrdinal(d3.schemeTableau10)
  .domain(allYears);

function renderPie(projectsData) {
  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');

  // clear previous
  svg.selectAll('path').remove();
  legend.html('');

  // group by year
  const rolled = d3.rollups(
    projectsData,
    v => v.length,
    d => d.year
  );

  const data = rolled.map(([year, count]) => ({
    label: year,
    value: count
  }));

  const arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

  const pie = d3.pie().value(d => d.value);
  const arcs = pie(data).map(d => arcGenerator(d));

  // draw slices
  arcs.forEach((arc, i) => {
    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(d.data.label))
      .attr('class', selectedYear === d.data.label ? 'selected' : '')
      .on('click', () => {
        selectedYear = selectedYear === d.data.label ? null : d.data.label;
        update(); // updates pie and projects list
      });
  });

  // draw legend
  data.forEach((d, i) => {
    const li = legend.append('li')
      .attr('class', selectedYear === d.label ? 'selected' : '')
      .on('click', () => {
        selectedYear = selectedYear === d.label ? null : d.label;
        update();
      });

    li.html(`<span class="swatch"></span> ${d.label} (${d.value})`);
    // dynamically set swatch color
    li.select('.swatch')
      .style('background', selectedYear === d.label ? 'oklch(60% 45% 0)' : colors(d.label));
  });
}

// SEARCH
const searchInput = document.querySelector('.searchBar');

searchInput?.addEventListener('input', (e) => {
  query = e.target.value;
  update(); // will filter both by search query AND selected year
});

// initial render
update();