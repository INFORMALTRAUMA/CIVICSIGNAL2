export type GeoJSONPoint = {
  type: "Point"
  coordinates: [number, number]
}

export function toGeoPoint(lat: number, lng: number): GeoJSONPoint {
  return { type: "Point", coordinates: [lng, lat] }
}
