/* TMDB Adult Content Filter
 * Sets adult=false on all items in responses
 * to prevent client-side adult content filtering by apps.
 *
 * Covers:
 * - /search/* (search results)
 * - /person/{id} (person detail with append_to_response credits)
 * - /person/{id}/movie_credits
 * - /person/{id}/tv_credits
 * - /person/{id}/combined_credits
 * - /movie/{id} and /tv/{id} (detail with adult flag)
 */

let body = JSON.parse($response.body);

// Helper: set adult=false on all items in an array
function clearAdult(items) {
    if (Array.isArray(items)) {
        items.forEach(function(item) { item.adult = false; });
    }
}

// Search results: { results: [...] }
clearAdult(body.results);

// Direct credits endpoints: { cast: [...], crew: [...] }
clearAdult(body.cast);
clearAdult(body.crew);

// Person detail with append_to_response credits
['movie_credits', 'tv_credits', 'combined_credits'].forEach(function(key) {
    if (body[key]) {
        clearAdult(body[key].cast);
        clearAdult(body[key].crew);
    }
});

// Set the object's own adult flag to false (person/movie/tv detail)
if ('adult' in body) {
    body.adult = false;
}

$done({ body: JSON.stringify(body) });
