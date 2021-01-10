const searchMovieInput = document.getElementById('searchMovieInput');
const suggestContainer = document.getElementById('suggestContainer');
const searchResultsContainer = document.getElementById('searchResultsContainer');
const maxSuggests = 10;
const maxLocalStorageSuggests = 5;
const maxLocalStorageSearchResults = 3;
const keyHystorySuggests = 'historySuggests';
const keyHystorySearchResults = "historySearchResults";
const localStorage = window.localStorage;
const BASE_URL_IMG = 'https://image.tmdb.org/t/p/w94_and_h141_bestv2';
const baseApiUrl = 'https://api.themoviedb.org/3';
const API_KEY = '492ee6396445f21839648f58ed9b15c6';
const LANGUAGE = 'ru-RU';

const setHistorySuggests = (value) => {
    let oldValue = getHistorySuggests();
    if (oldValue.length > maxLocalStorageSuggests - 1) {
        oldValue.pop();
    }
    localStorage.setItem(keyHystorySuggests, JSON.stringify([value, ...oldValue]));
}

const getHistorySuggests = () => {
    let rawValue = localStorage.getItem(keyHystorySuggests);
    if (!rawValue) {
        localStorage.setItem(keyHystorySuggests, "[]");
        return [];
    }
    return JSON.parse(rawValue);
}

const setHystorySearchResults = (value) => {
    let oldValue = getHystorySearchResults();
    if (oldValue.length > maxLocalStorageSearchResults - 1) {
        oldValue.pop();
    }
    localStorage.setItem(keyHystorySearchResults, JSON.stringify([value, ...oldValue]));
}

const getHystorySearchResults = () => {
    let rawValue = localStorage.getItem(keyHystorySearchResults);
    if (!rawValue) {
        localStorage.setItem(keyHystorySearchResults, "[]");
        return [];
    }
    return JSON.parse(rawValue);
}

const search = (query, handler) => {
    let url = `${baseApiUrl}/search/movie?api_key=${API_KEY}&query=${query}&&language=${LANGUAGE}`;
    const suggestEndpoint = encodeURI(url);
    const response = fetch(suggestEndpoint, {
    }).then((response) => {
        response.json()
            .then(response => {
                if (response.errors) {
                    console.error(response.errors);
                    return;
                }
                if (response.results.length > 0) {
                    handler(response.results);
                    return;
                }
            });
    }).catch(console.error);
}

const searchSuggest = (query) => {
    search(query, (elements) => {
        renderSuggestList(parseSuggestList(elements));
    })
}

const searchMovie = (query) => {
    search(query, (elements) => {
        let firstMovie = elements[0];
        if (firstMovie) {
            let movie = {
                'imgSrc': BASE_URL_IMG + firstMovie.poster_path,
                'title': firstMovie.title,
                'releasedAt': firstMovie.release_date,
                'description': firstMovie.overview,
            }
            setHistorySuggests(query);
            setHystorySearchResults(movie);
        }
        renderSuggestList(parseSuggestList(elements));
        renderSearchResults();
    })
}

const parseSuggestList = (elements) => {
    let items = [];
    let allowHystorySuggests = Math.min(maxLocalStorageSuggests, getHistorySuggests().length);
    let limit = Math.min(elements.length, maxSuggests - allowHystorySuggests);
    for (let i = 0; i < limit; i++) {
        let value = elements[i].title;
        if (value) {
            items.push(value)
        }
    }
    return items;
}

const openSuggest = () => {
    suggestContainer.hidden = false;
}

const closeSuggest = () => {
    setTimeout(() => {
        suggestContainer.hidden = true;
    }, 300)
}

const createSearchResultsItem = (item) => {
    let innerHTML = `
        <div class="search-results-item__image">
            <img src="${item.imgSrc}" alt="${item.title}">
        </div>
        <div class="search-results-item__details">
            <h3 class="search-results-item__title">${item.title}</h3>
            <span class="search-results-item__released">${item.releasedAt}</span>
            <div class="search-results-item__description">${item.description}</div>
        </div>
    `;
    let DOMNode = document.createElement('div');
    DOMNode.className = 'search-results-item';
    DOMNode.innerHTML = innerHTML;
    return DOMNode;
}

const renderSuggestList = (searchSuggests = []) => {
    const createSuggestItem = (value) => {
        let DOMNode = document.createElement('li');
        DOMNode.className = 'list-group__item';
        DOMNode.dataset.value = value
        DOMNode.innerHTML = value;
        return DOMNode;
    }

    let suggestListNode = document.createElement('ul');
    suggestListNode.className = 'list-group';

    searchSuggests.forEach(value => {
        suggestListNode.appendChild(createSuggestItem(value));
    });

    getHistorySuggests().forEach(value => {
        suggestListNode.appendChild(createSuggestItem(value));
    });

    suggestContainer.innerHTML = '';
    suggestContainer.appendChild(suggestListNode);
}

const renderSearchResults = () => {
    searchResultsContainer.innerHTML = '';
    getHystorySearchResults().forEach(item => {
        searchResultsContainer.appendChild(createSearchResultsItem(item));
    });
};

// init js

document.documentElement.addEventListener('click', {
    handleEvent(event) {
        if (event.target.classList.contains('list-group__item')) {
            searchMovieInput.value = event.target.dataset.value;
            searchMovie(searchMovieInput.value);
            closeSuggest();
        }
    }
})

searchMovieInput.addEventListener('input', {
    handleEvent(event) {
        searchSuggest(event.target.value); // @todo добавить задержку
    }
})

searchMovieInput.addEventListener('focusin', {
    handleEvent(event) {
        openSuggest();
    }
})

searchMovieInput.addEventListener('focusout', {
    handleEvent(event) {
        closeSuggest();
    }
})

window.addEventListener("storage", (event) => {
    if (event.key === keyHystorySearchResults) {
        renderSearchResults();   
    }
});

renderSearchResults();
renderSuggestList();
