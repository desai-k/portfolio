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
    let text = Object.values(p).join(' ').toLowerCase();

    let matchesSearch = text.includes(query.toLowerCase());
    let matchesYear =
      selectedYear === null || p.year === selectedYear;

    return matchesSearch && matchesYear;
  });
}

// PIE RENDER
const allYears = [...new Set(projects.map(p => p.year))];

const colors = d3.scaleOrdinal(d3.schemeTableau10)
  .domain(allYears);

function renderPie(filteredProjects) {
  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');

  // clear previous
  svg.selectAll('*').remove();
  legend.html('');

  const width = 120;
  const height = 120;
  const radius = 50;

  const g = svg
    .attr('viewBox', `0 0 ${width} ${height}`)
    .append('g')
    .attr('transform', `translate(${width / 2}, ${height / 2})`);

  // compute counts per year for filteredProjects
  const data = allYears.map(year => ({
    label: year,
    value: filteredProjects.filter(p => p.year === year).length
  }));

  const arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  const pie = d3.pie()
    .value(d => d.value)(data);

  // draw slices
  g.selectAll('path')
    .data(pie)
    .join('path')
    .attr('d', arcGenerator)
    .attr('fill', d => colors(d.data.label))
    .attr('class', d => d.data.label === selectedYear ? 'selected' : '')
    .on('click', (event, d) => {
      selectedYear = selectedYear === d.data.label ? null : d.data.label;
      update();
    });

  // legend
  data.forEach(d => {
    legend.append('li')
      .attr('style', `--color:${colors(d.label)}`)
      .attr('class', d.label === selectedYear ? 'selected' : '')
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
  renderPie(filtered); // dynamically reflect filtered projects
}

// initial render
update();