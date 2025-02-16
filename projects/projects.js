import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let selectedIndex = -1; 

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

const projectsTitle = document.querySelector('.projects-title');
const projectCount = projects.length;
projectsTitle.textContent = `My Projects (${projectCount})`;

let query = '';
const searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value.toLowerCase();
  const filteredProjects = projects.filter((p) => {
    let values = Object.values(p).join('\n').toLowerCase();
    return values.includes(query);
  });
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});


function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );
  let data = rolledData.map(([year, count]) => ({
    label: year,
    value: count
  }));
  const svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove(); 

  const legend = d3.select('.legend');
  legend.selectAll('li').remove();

  
  let arcGenerator = d3.arc()
    .innerRadius(0)
    .outerRadius(110);

  let sliceGenerator = d3.pie()
    .value(d => d.value);

  let arcData = sliceGenerator(data);

 
  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  
  arcData.forEach((arc, i) => {
    svg.append("path")
      .attr("d", arcGenerator(arc))
      .attr("fill", colors(i))
      .attr("transform", "translate(100,100)")
      .on("click", () => {
       
        selectedIndex = (selectedIndex === i) ? -1 : i;
  
        
        svg.selectAll("path")
          .attr("class", (_, idx) => (idx === selectedIndex) ? "selected" : "");
  
       
        legend.selectAll("li")
          .attr("class", (_, idx) => (idx === selectedIndex) ? "selected" : "");
  
        
        if (selectedIndex === -1) {
          
          renderProjects(projects, projectsContainer, 'h2');
          
          
        } else {
          
          let clickedYear = data[i].label;
          
          let yearProjects = projects.filter(p => p.year === clickedYear);
  
          
          renderProjects(yearProjects, projectsContainer, 'h2');
          
          
        }
      });
  });
  
  

  
  data.forEach((d, i) => {
    legend.append("li")
      .attr("style", `--color:${colors(i)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on("click", () => {
        selectedIndex = (selectedIndex === i) ? -1 : i;
  
        
        svg.selectAll("path")
          .attr("class", (_, idx) => (idx === selectedIndex) ? "selected" : "");
        legend.selectAll("li")
          .attr("class", (_, idx) => (idx === selectedIndex) ? "selected" : "");
  
       
        if (selectedIndex === -1) {
          renderProjects(projects, projectsContainer, 'h2');
          renderPieChart(projects);
        } else {
          let clickedYear = data[i].label;
          let yearProjects = projects.filter(p => p.year === clickedYear);
          renderProjects(yearProjects, projectsContainer, 'h2');
          
        }
      });
  });
  
  
}


renderPieChart(projects);
