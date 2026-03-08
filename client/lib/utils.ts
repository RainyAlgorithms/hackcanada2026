export const formatPrice = (p: number): string =>
  p >= 1_000_000 ? `$${(p / 1_000_000).toFixed(2)}M` : `$${(p / 1_000).toFixed(0)}K`

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  single_family_residential: 'Single Family',
  condo: 'Condo',
  townhouse: 'Townhouse',
}
