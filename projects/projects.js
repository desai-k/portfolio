import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';
 
// ─── Data ────────────────────────────────────────────────────────────────────
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
 
// Update heading count
const title = document.querySelector('.projects-title');
if (title) title.textContent = `${projects.length} Projects`;
 
// ─── State ───────────────────────────────────────────────────────────────────
let query         = '';   // current search string
let selectedIndex = -1;   // index into the PIE DATA array (-1 = none)
 
// ─── Color scale (domain fixed to all years so colors never shift) ────────────
const allYears = [...new Set(projects.map(p => p.year))].sort();
const colors   = d3.scaleOrdinal(d3.schemeTableau10).domain(allYears);
 
// ─── D3 handles ──────────────────────────────────────────────────────────────
const svg    = d3.select('#projects-pie-plot');
const legend = d3.select('.legend');
 
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
const pie          = d3.pie().value(d => d.value);
 
// ─── Render ──────────────────────────────────────────────────────────────────
 
/**
 * Render pie chart + legend from `pieProjects`.
 * The pie always reflects the search-filtered set (NOT the year filter),
 * so clicking a slice doesn't collapse the chart to one wedge.
 */
function renderPieChart(pieProjects) {
  // Build data: projects grouped by year
  const rolled = d3.rollups(pieProjects, v => v.length, d => d.year);
  const data   = rolled.map(([year, count]) => ({ label: year, value: count }));
 
  // Clear old drawing
  svg.selectAll('path').remove();
  legend.html('');
 
  if (data.length === 0) return;
 
  const arcData = pie(data);
  const arcs    = arcData.map(d => arcGenerator(d));
 
  // ── Slices ──────────────────────────────────────────────────────────────
  arcs.forEach((arcPath, i) => {
    svg.append('path')
      .attr('d', arcPath)
      .attr('fill', colors(data[i].label))
      .attr('class', selectedIndex === i ? 'selected' : '')
      .on('click', () => {
        // Toggle selection
        selectedIndex = selectedIndex === i ? -1 : i;
        update();
      });
  });
 
  // ── Legend ───────────────────────────────────────────────────────────────
  data.forEach((d, i) => {
    const li = legend.append('li')
      .attr('style', `--color: ${colors(d.label)}`)
      .attr('class', selectedIndex === i ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        update();
      });
 
    li.html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}
 
// ─── Central update ──────────────────────────────────────────────────────────
 
/**
 * Projects that match the search query only (used to draw the pie).
 */
function searchFilteredProjects() {
  return projects.filter(p => {
    const text = Object.values(p).join('\n').toLowerCase();
    return text.includes(query.toLowerCase());
  });
}
 
/**
 * Projects matching BOTH the search query AND the selected year (used for
 * the card list).
 */
function fullyFilteredProjects(searchFiltered, pieData) {
  if (selectedIndex === -1) return searchFiltered;
  const selectedYear = pieData[selectedIndex]?.label ?? null;
  if (selectedYear === null) return searchFiltered;
  return searchFiltered.filter(p => p.year === selectedYear);
}
 
function update() {
  // 1. Projects matching the search text
  const searchFiltered = searchFilteredProjects();
 
  // 2. Build the pie data from search-filtered projects (so pie never collapses)
  const rolled  = d3.rollups(searchFiltered, v => v.length, d => d.year);
  const pieData = rolled.map(([year, count]) => ({ label: year, value: count }));
 
  // 3. Guard: if selectedIndex is out of range after a search narrows results,
  //    reset it so we don't show a stale selection.
  if (selectedIndex >= pieData.length) selectedIndex = -1;
 
  // 4. Projects shown in card list = search + year filter
  const cardProjects = fullyFilteredProjects(searchFiltered, pieData);
 
  // 5. Render
  renderProjects(cardProjects, projectsContainer, 'h2');
  renderPieChart(searchFiltered);   // pie drawn from search-only filtered set
}
 
// ─── Search ──────────────────────────────────────────────────────────────────
const searchInput = document.querySelector('.searchBar');
searchInput?.addEventListener('input', e => {
  query = e.target.value;
  update();
});
 
// ─── Initial render ──────────────────────────────────────────────────────────
update();