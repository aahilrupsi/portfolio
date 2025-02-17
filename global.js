console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

const isSubfolder = location.pathname.includes('/projects/') ||
                    location.pathname.includes('/contact/') ||
                    location.pathname.includes('/meta/');
const prefix = isSubfolder ? '../' : './';


let pages = [
  { url: prefix + 'index.html',          title: 'About'   }, 
  { url: prefix + 'projects/index.html', title: 'Projects'},
  { url: prefix + 'contact/index.html',  title: 'Contact' },
  { url: prefix + 'contact/resumepage.html', title: 'Resume' },
  { url: prefix + 'meta/index.html',     title: 'Meta'    }
];


let nav = document.createElement('nav');
document.body.prepend(nav);


for (let p of pages) {
  let a = document.createElement('a');
  a.href = p.url;
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

