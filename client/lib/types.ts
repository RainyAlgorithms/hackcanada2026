export interface Property {
  property_id: string
  list_price: number
  address: {
    street_number: string
    street: string
    unit?: string
    city: string
    state_code: string
    postal_code: string
    latitude: number
    longitude: number
  }
  description: {
    beds: number
    baths: number
    sqft_living: number
    lot_size: number
    year_built: number
    property_type: string
  }
  photo: string
  status: string
  listing_id: string
  agent: { name: string; office: string }
  open_house: string | null
}

export type AppPage = 'landing' | 'map'
