import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

const title = document.querySelector('.projects-title');
if (title) {
  title.textContent = `${projects.length} ` + title.textContent;
}

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let colors = d3.scaleOrdinal(d3.schemeTableau10);

let selectedIndex = -1;

function renderPieChart(projectsGiven) {
  // re-calculate rolled data
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  // re-calculate data
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year }; // TODO
  });
  // re-calculate slice generator, arc data, arc, etc.
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  let svg = d3.select('svg');
  svg.selectAll('path').remove();
  let legend = d3.select('.legend');  
  legend.selectAll('li').remove();

  newArcs.forEach((arc, idx) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(idx))
      .on('click', () => {
        selectedIndex = selectedIndex === idx ? -1 : idx;

        svg
        .selectAll('path')
        .attr('class', (_, idx) => (
          idx === selectedIndex ? 'selected' : ''
        ));

        legend
        .selectAll('li')
        .attr('class', (_, idx) => (
          idx === selectedIndex ? 'item-selected' : 'item'
        ));

        if (selectedIndex === -1) {
          renderProjects(projects, projectsContainer, 'h2');
        } else {
          let filteredProjects = projects.filter((project) => 
            project.year === newData[selectedIndex].label
          );
          renderProjects(filteredProjects, projectsContainer, 'h2');
        }
      });
    })

    newData.forEach((d, idx) => {
      legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', 'item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
}

// Call this function on page load
renderPieChart(projects);

let query = '';
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('change', (event) => {
  // update query value
  query = event.target.value;
  // filter projects
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
  // render filtered projects
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});