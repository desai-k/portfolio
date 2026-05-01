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
function renderPie(projectsData) {
  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');

  // clear
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

  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  const arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(50);

  const arcs = d3.pie()
    .value(d => d.value)(data)
    .map(d => arcGenerator(d));

  // draw slices
  arcs.forEach((arc, i) => {
    svg.append('path')
      .attr('d', arc)
      .attr('fill', colors(data[i].label))
      .attr('class', selectedYear === data[i].label ? 'selected' : '')
      .on('click', () => {
        selectedYear =
          selectedYear === data[i].label ? null : data[i].label;

        update();
      });
  });

  // legend
  data.forEach((d, i) => {
    legend.append('li')
      .attr('style', `--color:${colors(d.label)}`)
      .attr('class', selectedYear === d.label ? 'selected' : '')
      .html(`<span class="swatch"></span> ${d.label} (${d.value})`)
      .on('click', () => {
        selectedYear =
          selectedYear === d.label ? null : d.label;

        update();
      });
  });
}

// SEARCH
const searchInput = document.querySelector('.searchBar');

searchInput?.addEventListener('input', e => {  query = e.target.value;
  update();
});

// UPDATE (single source of truth)
function update() {
  const filtered = getFilteredProjects();

  renderProjects(filtered, container, 'h2');
  renderPie(filtered);
}

// initial render
update();