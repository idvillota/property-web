import { useParams } from 'react-router-dom'

/** Horizontal property id from `/properties/:propertyId/...` routes. */
export function usePropertyId() {
  const { propertyId } = useParams<{ propertyId: string }>()
  if (!propertyId) {
    throw new Error('Missing propertyId route parameter')
  }
  return propertyId
}
