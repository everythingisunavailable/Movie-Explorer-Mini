
const BASE_URL = "https://api.themoviedb.org/3";
let genreMap = {};

async function fetchGenres() {
    const data = await tmdb("/genre/movie/list");
    if (data && data.genres) {
        data.genres.forEach(g => {
            genreMap[g.id] = g.name;
        });
    }
}

async function tmdb(endpoint, params = {}) {
    // Add the api key
    params.api_key = API_KEY;

    // Turn parameters into query string
    const query = new URLSearchParams(params).toString();
    const url = `${BASE_URL}${endpoint}?${query}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`TMDB Error: ${response.status}`);
        }

        return await response.json();
    } catch (err) {
        console.error("TMDB Fetch Error:", err);
        return null;
    }
}

// // Example 1: Search movie
// tmdb("/search/movie", { query: "Matrix" }).then(data => console.log(data));

// // Example 2: Popular movies
// tmdb("/movie/popular").then(data => console.log(data));

// // Example 3: Get a movie by ID
// tmdb("/movie/550").then(data => console.log(data));

function build_dom(data)
{
	const main = document.querySelector("main");
	main.innerHTML = "";

	data.results.forEach(movie => {
        const card = document.createElement("div");
        card.className = "card";

        const image = movie.backdrop_path || movie.poster_path;
        const rating = movie.vote_average?.toFixed(1) || "N/A";

        const genres = movie.genre_ids
            .map(id => genreMap[id])
            .slice(0, 1)
            .join(", ") || "Unknown";

        card.style.backgroundImage =
            image ? `url(https://image.tmdb.org/t/p/original${image})` : "none";

        card.innerHTML = `
            <div class="info">
                <span class="genre">${genres}</span>
                <span class="rating">${rating}</span>
            </div>
            <div class="title-foreground">
                <h3>${movie.title}</h3>
            </div>
        `;

        main.appendChild(card);
    });
}

async function loadMoviesIntoMain(query) {
    if (Object.keys(genreMap).length === 0) {
        await fetchGenres();
    }

    const data = await tmdb("/movie/popular", { query });

    if (!data || !data.results) return;

	build_dom(data);
}

async function loadSearchedIntoMain(query)
{
	if (Object.keys(genreMap).length === 0) {
        await fetchGenres();
    }

    const data = await tmdb("/search/movie", { query });

    if (!data || !data.results) return;

	build_dom(data);
}

async function search() {
	let query = document.getElementById("search").value;
	if (query[0] === ':')
		await loadByGenre(query.slice(1));
	else if (query === "")
		await loadMoviesIntoMain();
	else
		await loadSearchedIntoMain(query);
}

async function loadByGenre(genreText) {
	if (Object.keys(genreMap).length === 0) {
		await fetchGenres();
    }
	
    const genreID = Object.keys(genreMap).find(id =>
        genreMap[id].toLowerCase() === genreText.toLowerCase()
    );
	
    if (!genreID) {
		console.warn("Genre not found:", genreText);
        return;
    }
	
    const data = await tmdb("/discover/movie", {
		with_genres: genreID,
        sort_by: "popularity.desc"
    });
	
    if (!data || !data.results) return;
	
    const filtered = data.results.filter(movie =>
        movie.genre_ids && movie.genre_ids.length > 0 && movie.genre_ids[0] == genreID
    );
	
    build_dom({ results: filtered });
}

function get_genre(aprox) {
    if (!aprox || aprox[0] !== ':') return null;

    const search = aprox.slice(1);

    for (const [id, name] of Object.entries(genreMap)) {
        if (name.startsWith(search)) {
            return name;
        }
    }

    return null;
}

const search_field = document.getElementById("search");
const ghost = document.getElementById("ghost");

search_field.addEventListener("input", async ()=>
{
	if (Object.keys(genreMap).length === 0) {
		await fetchGenres();
	}
	
	let prefix = ":";
	if (!get_genre(search_field.value))
		ghost.value = '';
	else
		ghost.value = prefix.concat(get_genre(search_field.value));

});

search_field.addEventListener("keydown", (event)=>{
	if(event.key === "Tab") {
		event.preventDefault();
		search_field.value = ghost.value;
		ghost.value = '';
	}
});

search_field.addEventListener("keydown", (event)=>{
	if (event.key === "Enter") {
		search();
	}
});

loadMoviesIntoMain();