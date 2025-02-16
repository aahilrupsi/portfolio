console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

function fixSlashes(str) {
  // Only collapse slashes that aren't part of "http://"
  return str.replace(/([^:])\/{2,}/g, '$1/');
}

/**
 * 1) Determine which page we’re on. If we’re on the projects or meta pages,
 *    we might want an extra "../" prefix to go back to the root.
 */
const onProjectsPage = location.pathname.includes('/projects/');
const onMetaPage = location.pathname.includes('/meta/');
let prefix = (onProjectsPage || onMetaPage) ? '../' : './';

/**
 * 2) Check if we’re on GitHub Pages. If so, we append "/portfolio"
 *    so links resolve properly. Adjust as needed for your repo name.
 */
const isGitHubPages = window.location.hostname.includes('github.io');
if (isGitHubPages) {
  // e.g., "prefix" => "./" or "../"
  // Then ensure we end up with ".../portfolio/"
  prefix = prefix.replace(/\/+$/, '') + '/portfolio/';
}

// Fix potential double slashes
prefix = fixSlashes(prefix);

/**
 * 3) Navigation array: define site pages and their URLs.
 */
let pages = [
  { url: prefix,                 title: 'About'    },
  { url: prefix + 'projects/',   title: 'Projects' },
  { url: prefix + 'contact/',    title: 'Contact'  },
  { url: prefix + 'contact/resumepage.html', title: 'Resume' },
  { url: prefix + 'meta/index.html',         title: 'Meta'   },
];

let nav = document.createElement('nav');
document.body.prepend(nav);

const ARE_WE_HOME = document.documentElement.classList.contains('home');

for (let p of pages) {
  let url = p.url;
  if (!ARE_WE_HOME && !url.startsWith('http')) {
    url = '../' + url; 
  }
  let a = document.createElement('a');
  a.href = url;
  //console.log(a.href);
  a.textContent = p.title;

  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  a.toggleAttribute('target', a.host !== location.host);

  
  nav.append(a);
}

document.body.insertAdjacentHTML(
  "afterbegin",
  `
  <label class="color-scheme">
    Theme:
    <select id="color-scheme-selector">
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

const select = document.querySelector("#color-scheme-selector");

if ("colorScheme" in localStorage) {
  const savedScheme = localStorage.colorScheme;
  document.documentElement.style.setProperty("color-scheme", savedScheme);
  select.value = savedScheme;
}

select.addEventListener("input", function (event) {
  const newScheme = event.target.value;
  document.documentElement.style.setProperty("color-scheme", newScheme);
  localStorage.colorScheme = newScheme; 
});

export async function fetchJSON(url) {
  try {
    
    const response = await fetch(url);

    
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projectsArray, containerElement, headingLevel = 'h2') {
  
  containerElement.innerHTML = '';

  projectsArray.forEach((project) => {

    const onProjectsPage = location.pathname.includes('/projects/');

    const imagePath = onProjectsPage
      ? '../' + project.image
      : project.image;

    console.log('Rendering project:', project.title);
    console.log('onProjectsPage =', onProjectsPage, '=> imagePath =', imagePath);


    const article = document.createElement('article');
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${imagePath}" alt="${project.title}">
      <div class="project-details">
        <p>${project.description}</p>
        <span class="project-year">${project.year}</span>
      </div>
    `;

    
    containerElement.appendChild(article);
  });
}


export async function fetchGitHubData(username) {
  
  return fetchJSON(`https://api.github.com/users/${username}`);
}

