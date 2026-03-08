// listing-lookup.js — Works with real Toronto schools
import listingsData from './mock-listings.json' assert { type: 'json' };

/**
 * Find a property by address (fuzzy match)
 */
export function findPropertyByAddress(searchAddress) {
    if (!searchAddress) return null;

    const search = searchAddress
        .toLowerCase()
        .replace(/,?\s*(on|ontario|ca|canada)\s*$/i, '')
        .trim();

    const properties = listingsData.data.properties;

    // Try exact match first
    const exact = properties.find(p => {
        const fullAddr = `${p.address.street_number} ${p.address.street} ${p.address.city}`
            .toLowerCase();
        return fullAddr.includes(search) || search.includes(fullAddr);
    });
    if (exact) return exact;

    // Try fuzzy match
    const fuzzy = properties.find(p => {
        const addr = `${p.address.street_number} ${p.address.street} ${p.address.city}`.toLowerCase();
        const parts = search.split(/\s+/).filter(p => p.length > 2);
        return parts.every(part => addr.includes(part));
    });
    if (fuzzy) return fuzzy;

    // Try partial match
    const parts = search.split(/\s+/);
    const streetNum = parts[0];
    const partial = properties.find(p =>
        p.address.street_number === streetNum
    );
    if (partial) return partial;

    return null;
}

/**
 * Get all listings
 */
export function getAllListings() {
    return listingsData.data.properties;
}

/**
 * Get listings by city
 */
export function getListingsByCity(city) {
    return listingsData.data.properties.filter(p =>
        p.address.city.toLowerCase() === city.toLowerCase()
    );
}

/**
 * Get listings by property type
 */
export function getListingsByType(type) {
    return listingsData.data.properties.filter(p =>
        p.description.property_type.toLowerCase().includes(type.toLowerCase())
    );
}

/**
 * Get listings in price range
 */
export function getListingsByPriceRange(minPrice, maxPrice) {
    return listingsData.data.properties.filter(p =>
        p.list_price >= minPrice && p.list_price <= maxPrice
    );
}

/**
 * Get listings with min beds
 */
export function getListingsByBeds(minBeds) {
    return listingsData.data.properties.filter(p =>
        p.description.beds >= minBeds
    );
}

/**
 * Format property for display
 */
export function formatPropertyForDisplay(property) {
    if (!property) return null;

    const fullAddress = `${property.address.street_number} ${property.address.street}${property.address.unit ? ' Unit ' + property.address.unit : ''}, ${property.address.city}, ${property.address.state_code} ${property.address.postal_code}`;

    return {
        address: fullAddress,
        price: `$${property.list_price.toLocaleString()}`,
        beds: property.description.beds,
        baths: property.description.baths,
        sqft: property.description.sqft_living,
        propertyType: property.description.property_type.replace(/_/g, ' '),
        yearBuilt: property.description.year_built,
        description: property.propertyDescription || `${property.description.beds} bed, ${property.description.baths} bath property`,
        walkScore: property.walkScore || 'N/A',
        transitScore: property.transitScore || 'N/A',
        schools: (property.schools || []).map(s => `${s.name} (${s.rating.toFixed(1)}/10, ${s.distance}km away)`),
        nearbyAmenities: property.nearbyAmenities || [],
        garage: property.garage || 0,
        lotSize: property.description.lot_size || 0
    };
}

export default {
    findPropertyByAddress,
    getAllListings,
    getListingsByCity,
    getListingsByType,
    getListingsByPriceRange,
    getListingsByBeds,
    formatPropertyForDisplay
};