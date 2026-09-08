<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\BaseApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Server-side reverse / forward geocoding proxy for the Vendor Certification
 * map step. Direct port of the reference app's `helpers/geocode.php`:
 * routing lookups through the server keeps any provider token server-side,
 * allows caching, and gives the browser one stable contract.
 *
 * Provider: Mapbox when `vendors.map.mapbox_token` is set, otherwise
 * Nominatim / OpenStreetMap (key-free) — the source app's default fallback.
 */
class GeocodeController extends BaseApiController
{
    private const UA = 'FINOOCEAN-VendorCertification/1.0';

    private const TTL = 86400;

    /** GET /api/v1/geocode?mode=reverse&lat=..&lng=..  |  &mode=forward&q=..  |  &mode=suggest&q=.. */
    public function __invoke(Request $request): JsonResponse
    {
        return match ($request->query('mode', 'reverse')) {
            'reverse' => $this->reverse($request),
            'forward' => $this->forward($request),
            'suggest' => $this->suggest($request),
            default => $this->respondError('Unsupported mode.', 400),
        };
    }

    private function mapboxToken(): string
    {
        $token = (string) config('vendors.map.mapbox_token', '');

        return str_starts_with($token, 'pk.') ? $token : '';
    }

    private function reverse(Request $request): JsonResponse
    {
        $lat = $request->query('lat');
        $lng = $request->query('lng');

        if (! is_numeric($lat) || ! is_numeric($lng)) {
            return $this->respondError('Invalid coordinates.', 422);
        }

        $lat = round((float) $lat, 6);
        $lng = round((float) $lng, 6);

        $data = Cache::remember("geocode:rev:$lat:$lng", self::TTL, function () use ($lat, $lng): ?array {
            if ($token = $this->mapboxToken()) {
                $res = Http::withHeaders(['User-Agent' => self::UA])
                    ->get("https://api.mapbox.com/geocoding/v5/mapbox.places/{$lng},{$lat}.json", [
                        'access_token' => $token, 'language' => 'en', 'limit' => 1,
                        'types' => 'address,poi,neighborhood,locality,place,postcode',
                    ]);
                $feature = $res->json('features.0');

                return is_array($feature) ? $this->mapMapboxFeature($feature) : null;
            }

            $res = Http::withHeaders(['User-Agent' => self::UA])
                ->get('https://nominatim.openstreetmap.org/reverse', [
                    'format' => 'jsonv2', 'lat' => $lat, 'lon' => $lng, 'zoom' => 18, 'addressdetails' => 1,
                ]);
            $body = $res->json();

            return is_array($body) && ! empty($body['address'])
                ? $this->mapNominatimAddress($body['address'], (string) ($body['display_name'] ?? ''))
                : null;
        });

        return $data === null
            ? $this->respondSuccess(null, 'Address lookup unavailable. Please type the address manually.')
            : $this->respondSuccess($data);
    }

    private function forward(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        if (mb_strlen($q) < 4) {
            return $this->respondError('Please type at least 4 characters.', 422);
        }

        $data = Cache::remember('geocode:fwd:'.mb_strtolower($q), self::TTL, function () use ($q): ?array {
            if ($token = $this->mapboxToken()) {
                $res = Http::withHeaders(['User-Agent' => self::UA])
                    ->get('https://api.mapbox.com/geocoding/v5/mapbox.places/'.rawurlencode($q).'.json', [
                        'access_token' => $token, 'language' => 'en', 'limit' => 1, 'country' => 'in',
                    ]);
                $feature = $res->json('features.0');
                if (! is_array($feature) || ! is_array($feature['center'] ?? null)) {
                    return null;
                }
                $mapped = $this->mapMapboxFeature($feature);
                $mapped['lat'] = (float) $feature['center'][1];
                $mapped['lng'] = (float) $feature['center'][0];

                return $mapped;
            }

            $res = Http::withHeaders(['User-Agent' => self::UA])
                ->get('https://nominatim.openstreetmap.org/search', [
                    'format' => 'jsonv2', 'addressdetails' => 1, 'limit' => 1, 'countrycodes' => 'in', 'q' => $q,
                ]);
            $hit = $res->json('0');
            if (! is_array($hit) || ! isset($hit['lat'])) {
                return null;
            }
            $mapped = $this->mapNominatimAddress($hit['address'] ?? [], (string) ($hit['display_name'] ?? $q));
            $mapped['lat'] = (float) $hit['lat'];
            $mapped['lng'] = (float) $hit['lon'];

            return $mapped;
        });

        return $data === null
            ? $this->respondSuccess(null, 'No location found for that address.')
            : $this->respondSuccess($data);
    }

    private function suggest(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        if (mb_strlen($q) < 3) {
            return $this->respondSuccess([]);
        }

        $items = Cache::remember('geocode:sug:'.mb_strtolower($q), self::TTL, function () use ($q): array {
            $res = Http::withHeaders(['User-Agent' => self::UA])
                ->get('https://nominatim.openstreetmap.org/search', [
                    'format' => 'jsonv2', 'addressdetails' => 1, 'limit' => 6, 'countrycodes' => 'in', 'q' => $q,
                ]);
            $body = $res->json();
            if (! is_array($body)) {
                return [];
            }

            $out = [];
            foreach ($body as $hit) {
                if (! isset($hit['lat'], $hit['lon'])) {
                    continue;
                }
                $display = (string) ($hit['display_name'] ?? '');
                $parts = array_map('trim', explode(',', $display));
                $out[] = [
                    'title' => $parts[0] ?? $display,
                    'subtitle' => trim(implode(', ', array_slice($parts, 1, 4))),
                    'display' => $display,
                    'lat' => (float) $hit['lat'],
                    'lng' => (float) $hit['lon'],
                ];
            }

            return $out;
        });

        return $this->respondSuccess($items);
    }

    /**
     * @param  array<string, mixed>  $addr
     * @return array<string, mixed>
     */
    private function mapNominatimAddress(array $addr, string $display): array
    {
        return [
            'address' => $display,
            'house_no' => $addr['house_number'] ?? '',
            'building' => $addr['building'] ?? $addr['residential'] ?? '',
            'street' => $addr['road'] ?? $addr['pedestrian'] ?? '',
            'landmark' => $addr['amenity'] ?? $addr['shop'] ?? $addr['suburb'] ?? '',
            'area' => $addr['suburb'] ?? $addr['neighbourhood'] ?? $addr['quarter'] ?? '',
            'village' => $addr['village'] ?? $addr['hamlet'] ?? $addr['ward'] ?? '',
            'city' => $addr['city'] ?? $addr['town'] ?? $addr['village'] ?? $addr['municipality'] ?? '',
            'district' => $addr['state_district'] ?? $addr['county'] ?? '',
            'state' => $addr['state'] ?? '',
            'pin_code' => $addr['postcode'] ?? '',
            'country' => $addr['country'] ?? 'India',
        ];
    }

    /**
     * @param  array<string, mixed>  $f
     * @return array<string, mixed>
     */
    private function mapMapboxFeature(array $f): array
    {
        $ctx = [];
        foreach ($f['context'] ?? [] as $item) {
            $type = explode('.', (string) ($item['id'] ?? ''))[0];
            $ctx[$type] = (string) ($item['text'] ?? '');
        }
        $type = (string) ($f['place_type'][0] ?? '');
        $text = (string) ($f['text'] ?? '');
        $road = $type === 'address' ? $text : ($ctx['street'] ?? '');

        return [
            'address' => (string) ($f['place_name'] ?? $text),
            'house_no' => (string) ($f['address'] ?? ''),
            'building' => in_array($type, ['poi', 'poi.landmark'], true) ? $text : '',
            'street' => $road,
            'landmark' => $type === 'poi' ? $text : '',
            'area' => $ctx['neighborhood'] ?? $ctx['locality'] ?? '',
            'village' => $ctx['locality'] ?? '',
            'city' => $ctx['place'] ?? $ctx['locality'] ?? '',
            'district' => $ctx['district'] ?? '',
            'state' => $ctx['region'] ?? '',
            'pin_code' => $ctx['postcode'] ?? '',
            'country' => $ctx['country'] ?? 'India',
        ];
    }
}
