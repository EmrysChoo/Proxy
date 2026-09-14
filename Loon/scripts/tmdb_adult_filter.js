/* TMDB Adult Content Filter
 * Sets adult=false on all credit items in person responses
 * to prevent client-side adult content filtering by apps.
 *
 * Covers:
 * - /person/{id} (person detail with append_to_response credits)
 * - /person/{id}/movie_credits
 * - /person/{id}/tv_credits
 * - /person/{id}/combined_credits
 */

let body = JSON.parse($response.body);

// Helper: set adult=false on all items in an array
function clearAdult(items) {
    if (Array.isArray(items)) {
        items.forEach(function(item) { item.adult = false; });
    }
}

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

// Set person's own adult flag to false
if ('adult' in body) {
    body.adult = false;
}

$done({ body: JSON.stringify(body) });
