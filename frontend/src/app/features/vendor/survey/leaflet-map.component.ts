import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  ViewEncapsulation,
  AfterViewInit,
} from '@angular/core';
import * as L from 'leaflet';

/**
 * CSS-drawn pin so the component carries no external marker-image asset
 * dependency (Leaflet's default PNG icons don't survive bundling cleanly).
 */
const PIN_ICON = L.divIcon({
  className: 'leaflet-vendor-pin',
  html: '<span class="leaflet-vendor-pin__dot"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 26],
});

/** {lat,lng} pair emitted whenever the pin moves. */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Interactive single-pin location picker — the Fino port of the reference
 * app's `map.js` `LocationPicker` (Leaflet + OpenStreetMap tiles, key-free).
 * Drag the marker or click the map to move the pin; the host reverse-geocodes
 * on `pinMoved`.
 */
@Component({
  selector: 'app-leaflet-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #map class="leaflet-map"></div>`,
  // Encapsulation.None so the CSS-drawn Leaflet pin (rendered outside this
  // component's DOM) can be styled here rather than polluting styles.scss.
  encapsulation: ViewEncapsulation.None,
  styles: [
    `
      app-leaflet-map {
        display: block;
      }
      app-leaflet-map .leaflet-map {
        width: 100%;
        height: 340px;
        border-radius: var(--app-radius-md);
        overflow: hidden;
        z-index: 0;
      }
      .leaflet-vendor-pin {
        background: transparent;
        border: 0;
      }
      .leaflet-vendor-pin__dot {
        display: block;
        width: 22px;
        height: 22px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: var(--tide-color-action, #e85a3b);
        border: 3px solid #fff;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
      }
    `,
  ],
})
export class LeafletMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('map', { static: true }) private mapEl!: ElementRef<HTMLDivElement>;

  @Input() lat = 21.1458;
  @Input() lng = 79.0882;
  @Input() zoom = 15;

  /** Emitted on drag / click (user moves), not on programmatic setPosition. */
  @Output() pinMoved = new EventEmitter<LatLng>();

  private map?: L.Map;
  private marker?: L.Marker;
  private accuracyCircle?: L.Circle;

  ngAfterViewInit(): void {
    this.map = L.map(this.mapEl.nativeElement, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([this.lat, this.lng], this.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.marker = L.marker([this.lat, this.lng], {
      draggable: true,
      autoPan: true,
      icon: PIN_ICON,
      title: 'Vendor location — drag to adjust',
    }).addTo(this.map);

    this.marker.on('dragend', () => this.emit());
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.marker?.setLatLng(e.latlng);
      this.emit();
    });

    setTimeout(() => this.map?.invalidateSize(), 250);
  }

  /** Move pin + view without emitting `pinMoved` (used for GPS / search results). */
  setPosition(lat: number, lng: number, accuracy: number | null = null): void {
    this.lat = lat;
    this.lng = lng;
    this.marker?.setLatLng([lat, lng]);
    this.map?.setView([lat, lng], Math.max(this.map.getZoom() ?? this.zoom, 16));
    this.setAccuracy(lat, lng, accuracy);
  }

  refresh(): void {
    setTimeout(() => this.map?.invalidateSize(), 50);
  }

  private setAccuracy(lat: number, lng: number, accuracy: number | null): void {
    if (this.accuracyCircle) {
      this.map?.removeLayer(this.accuracyCircle);
      this.accuracyCircle = undefined;
    }
    if (accuracy && accuracy > 0 && this.map) {
      this.accuracyCircle = L.circle([lat, lng], {
        radius: accuracy,
        color: '#0d5bb9',
        weight: 1,
        fillColor: '#1667d6',
        fillOpacity: 0.12,
      }).addTo(this.map);
    }
  }

  private emit(): void {
    const p = this.marker?.getLatLng();
    if (!p) return;
    this.lat = +p.lat.toFixed(7);
    this.lng = +p.lng.toFixed(7);
    this.pinMoved.emit({ lat: this.lat, lng: this.lng });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }
}
