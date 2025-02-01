console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
  { url: 'https://aahilrupsi.github.io/portfolio/', title: 'About' },
  { url: 'https://aahilrupsi.github.io/portfolio/projects/', title: 'Projects' },
  { url: 'https://aahilrupsi.github.io/portfolio/contact/', title: 'Contact' },
  { url: 'https://aahilrupsi.github.io/portfolio/contact/resumepage.html', title: 'Resume' },
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
    
    const ARE_WE_HOME = location.pathname === '/' || location.pathname.endsWith('/index.html');
    console.log(location.pathname);
    console.log(ARE_WE_HOME);
    console.log("plz werk");
    const imagePath = ARE_WE_HOME ? project.image.replace('../', '') : project.image;
    console.log(imagePath);
    const article = document.createElement('article');
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${imagePath}" alt="${project.title}">
      <p>${project.description}</p>
    `;
    
    containerElement.appendChild(article);
  });
}

export async function fetchGitHubData(username) {
  
  return fetchJSON(`https://api.github.com/users/${username}`);
}

