
let data = [];    
let commits = []; 
let brushSelection = null; 

let xScale, yScale;


const width = 1000;
const height = 600;
const margin = { top: 10, right: 10, bottom: 30, left: 40 };
const usableArea = {
  top: margin.top,
  left: margin.left,
  right: width - margin.right,
  bottom: height - margin.bottom,
  width: width - margin.left - margin.right,
  height: height - margin.top - margin.bottom,
};

document.addEventListener('DOMContentLoaded', loadData);


async function loadData() {
  
  data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  processCommits();

  
  displayStats();

  createScatterplot();
}


function processCommits() {
  commits = d3
    .groups(data, (d) => d.commit) 
    .map(([commitID, lines]) => {
      const first = lines[0];
      const dt = new Date(first.datetime);

      const commitObj = {
        id: commitID,
        author: first.author,
        date: first.date,
        datetime: dt,
        hourFrac: dt.getHours() + dt.getMinutes() / 60,
        totalLines: lines.length,
    
      };

      
      Object.defineProperty(commitObj, 'lines', {
        value: lines,
        writable: false,
        enumerable: false,
        configurable: false,
      });

      return commitObj;
    });
}


function displayStats() {
  d3.select('#stats').html('');
  const dl = d3.select('#stats')
    .append('dl')
    .attr('class', 'stats');

 
  dl.append('dt').html('Total <abbr title="Lines of Code">LOC</abbr>');
  dl.append('dd').text(data.length);

  
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

 
  const fileCount = d3.groups(data, (d) => d.file).length;
  dl.append('dt').text('Distinct Files');
  dl.append('dd').text(fileCount);


  const maxDepth = d3.max(data, (d) => d.depth);
  dl.append('dt').text('Max Depth');
  dl.append('dd').text(maxDepth);

 
  const avgLen = d3.mean(data, (d) => d.length);
  dl.append('dt').text('Avg line length');
  dl.append('dd').text(Math.round(avgLen || 0));
}


function createScatterplot() {
  
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

 
  const xDomain = d3.extent(sortedCommits, (d) => d.datetime);
  xScale = d3.scaleTime()
    .domain(xDomain)
    .range([usableArea.left, usableArea.right])
    .nice();

  
  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  
  const [minLines, maxLines] = d3.extent(sortedCommits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]); 

  
  const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  
  const dotsGroup = svg.append('g').attr('class', 'dots');

  dotsGroup.selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .style('fill', 'steelblue')
    .style('fill-opacity', 0.7)
    
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      updateTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipContent({});
      updateTooltipVisibility(false);
    });

  
  const xAxis = d3.axisBottom(xScale).ticks(10);
  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  
  const yAxis = d3.axisLeft(yScale).tickFormat((d) => {
    let hour = d % 24;
    return String(hour).padStart(2, '0') + ':00';
  });
  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  
  const brush = d3.brush()
    .on('start brush end', brushed);

  
  d3.select(svg.node()).call(brush);

  d3.select(svg.node())
    .selectAll('.dots, .overlay ~ *')
    .raise();
}


function updateTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const dateEl = document.getElementById('commit-date');
  const authorEl = document.getElementById('commit-author');
  const linesEl = document.getElementById('commit-lines');

  if (!commit || Object.keys(commit).length === 0) {
    
    link.href = '';
    link.textContent = '';
    dateEl.textContent = '';
    authorEl.textContent = '';
    linesEl.textContent = '';
    return;
  }

  link.href = commit.url || '#';
  link.textContent = commit.id;
  dateEl.textContent = commit.datetime.toLocaleString('en', {
    dateStyle: 'full',
    timeStyle: 'short',
  });
  authorEl.textContent = commit.author || '???';
  linesEl.textContent = commit.totalLines || 0;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}


function brushed(event) {
  
  brushSelection = event.selection;
  
  updateSelection();
  
  updateSelectionCount();
  
  updateLanguageBreakdown();
}


function isCommitSelected(commit) {
  if (!brushSelection) return false;

  const [[x0, y0], [x1, y1]] = brushSelection;
  const cx = xScale(commit.datetime);
  const cy = yScale(commit.hourFrac);

  return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
}


function updateSelection() {
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}


function updateSelectionCount() {
  const selectedCommits = brushSelection
    ? commits.filter(isCommitSelected)
    : [];
  const countEl = document.getElementById('selection-count');
  countEl.textContent = `${selectedCommits.length || 'No'} commits selected`;
}


function updateLanguageBreakdown() {
  const container = document.getElementById('language-breakdown');

  
  if (!brushSelection) {
    container.innerHTML = '';
    return;
  }

  const selectedCommits = commits.filter(isCommitSelected);
  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }

  
  const lines = selectedCommits.flatMap((c) => c.lines);

  
  const breakdown = d3.rollup(
    lines,
    (v) => v.length,
    (d) => d.type
  );

  container.innerHTML = '';
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);
    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}
