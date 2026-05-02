import * as d3 from 'https://jsdelivr.net';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const container = document.querySelector('.projects');

// STATE
let query = '';
let selectedIndex = -1;

function renderPie(projectsGiven) {
  // 1. Re-calculate data
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  let newData = newRolledData.map(([year, count]) => {
    return { label: year, value: count };
  });

  // 2. Setup Generators
  const colors = d3.scaleOrdinal(d3.schemeTableau10);
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(newData);
  const arcs = arcData.map((d) => arcGenerator(d));

  // 3. Clear existing elements
  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  let legend = d3.select('.legend');
  legend.selectAll('*').remove();

  // 4. Create Paths (Wedges)
  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      // Step 5.2: Apply initial class
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => {
        // Toggle selection logic
        selectedIndex = selectedIndex === i ? -1 : i;

        // Update visual classes for ALL paths
        svg.selectAll('path')
           .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        // Update visual classes for ALL legend items
        legend.selectAll('li')
              .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        // Step 5.3: Filter projects by selected year
        if (selectedIndex === -1) {
          renderProjects(projectsGiven, container, 'h2');
        } else {
          let selectedYear = newData[selectedIndex].label;
          let filteredByYear = projectsGiven.filter(p => p.year === selectedYear);
          renderProjects(filteredByYear, container, 'h2');
        }
      });
  });

  // 5. Create Legend Items
  newData.forEach((d, i) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(i)}`)
      // Apply initial class
      .attr('class', i === selectedIndex ? 'selected' : '')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        // Same toggle logic as paths
        selectedIndex = selectedIndex === i ? -1 : i;

        svg.selectAll('path')
           .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        legend.selectAll('li')
              .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        if (selectedIndex === -1) {
          renderProjects(projectsGiven, container, 'h2');
        } else {
          let filteredByYear = projectsGiven.filter(p => p.year === d.label);
          renderProjects(filteredByYear, container, 'h2');
        }
      });
  });
}

// STEP 4: Search Bar Event Listener
const searchInput = document.querySelector('.searchBar');
searchInput?.addEventListener('input', (event) => {
  query = event.target.value;

  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  // Always reset selection when search query changes
  selectedIndex = -1;

  renderProjects(filteredProjects, container, 'h2');
  renderPie(filteredProjects);
});

// Initial Page Load
renderProjects(projects, container, 'h2');
renderPie(projects);
