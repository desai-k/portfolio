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
    .attr('d', arc)
    .style('fill', colors(data[i].label))  // style instead of attr
    .attr('class', selectedYear === data[i].label ? 'selected' : '')
    .on('click', () => {
      selectedYear = selectedYear === data[i].label ? null : data[i].label;
      update();
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

searchInput?.addEventListener('input', e => {  query = e.target.value;
  update();
});

// UPDATE
function update() {
  const filtered = getFilteredProjects();
  const searchFiltered = projects.filter(p => {
    let text = Object.values(p).join(' ').toLowerCase();
    return text.includes(query.toLowerCase());
  });

  renderProjects(filtered, container, 'h2');
  renderPie(searchFiltered);  // pie always shows all search-matching projects
}

// initial render
update();