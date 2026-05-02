import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

// Update title
const title = document.querySelector('.projects-title');
if (title) title.textContent = `${projects.length} Projects`;

const container = document.querySelector('.projects');
let query = '';
let selectedYear = null;

const allYears = [...new Set(projects.map(p => p.year))];
const colors = d3.scaleOrdinal(d3.schemeTableau10).domain(allYears);

const svg = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');

// FILTER FUNCTION
function getFilteredProjects() {
  return projects.filter(p => {
    const text = Object.values(p).join(' ').toLowerCase();
    const matchesSearch = text.includes(query.toLowerCase());
    const matchesYear = !selectedYear || p.year === selectedYear;
    return matchesSearch && matchesYear;
  });
}

// RENDER PIE FUNCTION
function renderPie(filteredProjects) {
  svg.selectAll('*').remove();
  legend.html('');

  const width = 120, height = 120, radius = 50, selectedRadius = 60;
  const g = svg.attr('viewBox', `0 0 ${width} ${height}`)
               .append('g')
               .attr('transform', `translate(${width/2},${height/2})`);

  const data = allYears.map(year => ({
    label: year,
    value: filteredProjects.filter(p => p.year === year).length
  }));

  const pie = d3.pie().value(d => d.value).sort(null);
  const arcs = pie(data);
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);

  // Draw slices
  g.selectAll('path')
    .data(arcs)
    .join('path')
    .attr('d', d => arcGenerator(d))
    .attr('fill', d => colors(d.data.label))
    .attr('class', d => d.data.label === selectedYear ? 'selected' : '')
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      selectedYear = selectedYear === d.data.label ? null : d.data.label;
      update();
    });

  // Enlarge selected slice
  g.selectAll('path')
   .transition().duration(300)
   .attr('d', d => {
     const r = d.data.label === selectedYear ? selectedRadius : radius;
     return d3.arc().innerRadius(0).outerRadius(r)(d);
   });

  // Draw legend
  data.forEach(d => {
    legend.append('li')
      .attr('class', d.label === selectedYear ? 'selected' : '')
      .attr('style', `--color:${colors(d.label)}`)
      .html(`<span class="swatch"></span> ${d.label} (${d.value})`)
      .on('click', () => {
        selectedYear = selectedYear === d.label ? null : d.label;
        update();
      });
  });
}

// UPDATE FUNCTION
function update() {
  const filtered = getFilteredProjects();
  renderProjects(filtered, container, 'h2');
  renderPie(filtered);
}

// SEARCH HANDLER
document.querySelector('.searchBar')?.addEventListener('input', e => {
  query = e.target.value;
  update();
});

// INITIAL RENDER
update();