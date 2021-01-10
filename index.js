const searchMovieInput = document.getElementById('searchMovieInput');
const suggestContainer = document.getElementById('suggestContainer');
const searchResultsContainer = document.getElementById('searchResultsContainer');
const maxLocalStorageSuggests = 5;
const maxLocalStorageSearchResults = 3;
const keyHystorySuggests = 'historySuggests';
const keyHystorySearchResults = "historySearchResults";
const localStorage = window.localStorage;

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

const searchSuggestOld = (query) => {
    const suggestEndpoint = encodeURI(`https://www.themoviedb.org/search/trending?query=${query}`);
    const response = fetch(suggestEndpoint, {
        // mode: 'no-cors',
    })
    .then((response) => {
        response.json()
            .then(response => {
                items = response.results.slice(2,7);
                suggestContainer.innerHTML = renderSuggestList(items);
                console.log(items);
            });
    })
    .catch(console.error);
}

const searchSuggest = (query) => {
    const suggestEndpoint = encodeURI(`https://www.themoviedb.org/search/movie?query=${query}`);
    const response = fetch(suggestEndpoint, {
        // mode: 'no-cors',
    })
    .then((response) => {
        response.text()
            .then(response => {
                let doc = new DOMParser().parseFromString(response, "text/html");
                let elements = doc.querySelectorAll('.search_results.movie .results .card');
                let items = [];
                for (let i=0; i<5; i++) {
                    let value = elements[i]?.querySelector('.details h2')?.innerHTML.trim();
                    if (value) {
                        items.push(value)
                    }
                }
                suggestContainer.innerHTML = renderSuggestList(items);
            });
    })
    .catch(console.error);
}

const searchMovie = (query) => {
    const movieEndpoint = encodeURI(`https://www.themoviedb.org/search/movie?query=${query}`);
    const response = fetch(movieEndpoint, {
        // mode: 'no-cors',
    })
    .then((response) => {
        response.text()
            .then(response => {
                let doc = new DOMParser().parseFromString(response, "text/html");
                let elements = doc.querySelectorAll('.search_results.movie .results .card');
                let firstMovie = elements[0];
                if (firstMovie) {
                    let image = firstMovie.querySelector('.image .poster img');
                    let title = firstMovie.querySelector('.details h2');
                    let releasedAt = firstMovie.querySelector('.details .release_date');
                    let description = firstMovie.querySelector('.details .overview');
                    let movie = {
                        'imgSrc': 'https://www.themoviedb.org' + image.src.slice(7),
                        'title': title.innerHTML.trim(),
                        'releasedAt': releasedAt.innerHTML.trim(),
                        'description': description.innerHTML.trim(),
                    }
                    setHistorySuggests(query);
                    setHystorySearchResults(movie);
                }
                renderSuggestList();
                renderSearchResults();
            });
    })
    .catch(console.error);
}

const openSuggest = () => {
    suggestContainer.hidden = false;
}

const closeSuggest = () => {
    setTimeout(() => {
        suggestContainer.hidden = true;
    }, 300)
}

const renderSuggestList = (list = []) => {
    let resultHtml = '<ul class="list-group">';
    list.forEach(element => {
        resultHtml += `<li class="list-group__item" data-value="${element}">${element}</li>`
    });
    getHistorySuggests().forEach(element => {
        resultHtml += `<li class="list-group__item" data-value="${element}">${element}</li>`
    });
    resultHtml += '</ul>';
    return resultHtml;
}

const renderSearchResultsItem = (item) => {
    let result = '<div class="search-results-item">'
    result += `<div class="search-results-item__image"><img src="${item.imgSrc}" alt="${item.title}"></div>`
    result += `<div class="search-results-item__details">
        <h3 class="search-results-item__title">${item.title}</h3>
        <span class="search-results-item__released">${item.releasedAt}</span>
        <div class="search-results-item__description">${item.description}</div>
    </div>`
    result += '</div>'
    return result;
}

const renderSearchResults = () => {
    const searchResults = getHystorySearchResults();

    let result = '';
    searchResults.forEach((item, index) => {
        result += renderSearchResultsItem(item);
        // parentElement.appendChild(resultRender);
    })

    searchResultsContainer.innerHTML = result;
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
        const query = event.target.value;
        const result = searchSuggest(query); // @todo добавить задержку
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
    console.log('event');
    if (event.key === keyHystorySearchResults) {
        setTimeout(renderSearchResults(), 300);   
    }
});

window.onstorage = event => {
    if (event.key != 'now') return;
    alert(event.key + ':' + event.newValue + " at " + event.url);
  };

renderSearchResults();
