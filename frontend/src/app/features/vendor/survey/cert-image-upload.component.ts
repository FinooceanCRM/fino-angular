import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { CertImage, CertImageProfile, CertImageType } from '@core/models/vendor-certification.model';
import { VendorCertificationService } from '@core/services/vendor-certification.service';
import { AuthImagePipe } from '@shared/pipes/auth-image.pipe';

/**
 * One image slot — the Fino port of `assets/js/upload.js` `UploadCard`:
 * format / size / resolution / quality (blur, too dark, too bright)
 * validation, canvas compression, XHR-progress upload, preview, replace and
 * remove. Used for the two mandatory photos and each extra-gallery photo.
 */
@Component({
  selector: 'app-cert-image-upload',
  standalone: true,
  imports: [AsyncPipe, MatButtonModule, MatIconModule, MatProgressBarModule, AuthImagePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cert-image-upload.component.html',
  styleUrl: './cert-image-upload.component.scss',
})
export class CertImageUploadComponent {
  private readonly certs = inject(VendorCertificationService);

  @Input({ required: true }) type!: CertImageType;
  @Input({ required: true }) profile!: CertImageProfile;
  /** true until the location step has produced coordinates. */
  @Input() locationLocked = false;
  @Input() set existing(value: CertImage | null) {
    this.image.set(value);
  }
  /** Compact tile (no title / spec text) — used for the extra-photos gallery. */
  @Input() compact = false;

  @Output() uploaded = new EventEmitter<CertImage>();
  @Output() removed = new EventEmitter<number>();

  @ViewChild('fileInput') private fileInput!: ElementRef<HTMLInputElement>;

  protected readonly image = signal<CertImage | null>(null);
  protected readonly busy = signal(false);
  protected readonly progress = signal(0);
  protected readonly error = signal<string | null>(null);
  protected readonly dragOver = signal(false);

  /* Client quality thresholds — mirror upload.js QUALITY. */
  private static readonly DARK_BELOW = 35;
  private static readonly BRIGHT_ABOVE = 234;
  private static readonly BLUR_BELOW = 11;

  protected get isMobile(): boolean {
    return (
      /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && window.matchMedia('(max-width: 992px)').matches)
    );
  }

  protected openPicker(capture?: 'user' | 'environment'): void {
    const input = this.fileInput.nativeElement;
    if (capture) input.setAttribute('capture', capture);
    else input.removeAttribute('capture');
    input.click();
  }

  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) void this.handle(file);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) void this.handle(file);
  }

  protected remove(): void {
    const current = this.image();
    if (!current) return;
    this.certs.deleteImage(current.id).subscribe({
      next: () => {
        this.image.set(null);
        this.removed.emit(current.id);
      },
      error: (err: { message?: string }) => this.error.set(err?.message ?? 'Could not remove the photo.'),
    });
  }

  /** Validate → compress → upload. */
  private async handle(file: File): Promise<void> {
    this.error.set(null);

    if (this.locationLocked) {
      this.error.set('Please complete the location step before uploading photographs.');
      return;
    }
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      this.error.set('Unsupported format. Please upload a JPG, PNG or WEBP image.');
      return;
    }
    if (file.size > this.profile.max_bytes) {
      this.error.set(
        `${this.profile.label} is too large (${this.formatBytes(file.size)}). Maximum is ${this.formatBytes(
          this.profile.max_bytes,
        )}.`,
      );
      return;
    }

    this.busy.set(true);
    this.progress.set(0);

    let img: HTMLImageElement;
    try {
      img = await this.loadImage(file);
    } catch {
      this.busy.set(false);
      this.error.set(`${this.profile.label} is corrupted or unreadable. Please choose another photo.`);
      return;
    }

    if (img.naturalWidth < this.profile.min_width || img.naturalHeight < this.profile.min_height) {
      this.busy.set(false);
      this.error.set(
        `${this.profile.label} resolution is too small (${img.naturalWidth} × ${img.naturalHeight}). ` +
          `Minimum is ${this.profile.min_width} × ${this.profile.min_height} pixels.`,
      );
      return;
    }

    const quality = this.analyse(img);
    if (quality.brightness < CertImageUploadComponent.DARK_BELOW) {
      this.fail(`${this.profile.label} is too dark. Please retake it in better light.`);
      return;
    }
    if (quality.brightness > CertImageUploadComponent.BRIGHT_ABOVE) {
      this.fail(`${this.profile.label} is too bright / washed out. Please retake it.`);
      return;
    }
    if (quality.sharpness < CertImageUploadComponent.BLUR_BELOW) {
      this.fail(`${this.profile.label} looks blurry. Hold the camera steady and try again.`);
      return;
    }

    const maxSide = Math.max(this.profile.pref_width, this.profile.pref_height);
    const blob = await this.compress(img, maxSide, 0.86);

    this.certs.uploadImage(this.type, blob, `${this.type}.jpg`).subscribe({
      next: (uploadedImage) => {
        this.busy.set(false);
        this.progress.set(100);
        this.image.set(uploadedImage);
        this.uploaded.emit(uploadedImage);
      },
      error: (err: { message?: string }) => {
        this.busy.set(false);
        this.error.set(err?.message ?? 'Upload failed. Please try again.');
      },
    });
  }

  private fail(message: string): void {
    this.busy.set(false);
    this.error.set(message);
  }

  private loadImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const el = new Image();
      el.onload = () => {
        URL.revokeObjectURL(url);
        resolve(el);
      };
      el.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('corrupt'));
      };
      el.src = url;
    });
  }

  /** Brightness + Laplacian-variance sharpness — mirrors upload.js analyse(). */
  private analyse(img: HTMLImageElement): { brightness: number; sharpness: number } {
    const size = 180;
    const scale = Math.min(size / img.naturalWidth, size / img.naturalHeight, 1);
    const w = Math.max(8, Math.round(img.naturalWidth * scale));
    const h = Math.max(8, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    const grey = new Float32Array(w * h);
    let sum = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const v = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      grey[p] = v;
      sum += v;
    }
    let mean = 0;
    let count = 0;
    const responses: number[] = [];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const v = 4 * grey[i] - grey[i - 1] - grey[i + 1] - grey[i - w] - grey[i + w];
        responses.push(v);
        mean += v;
        count++;
      }
    }
    mean = count ? mean / count : 0;
    let variance = 0;
    for (const v of responses) variance += (v - mean) ** 2;

    return {
      brightness: sum / (w * h),
      sharpness: count ? variance / count : 0,
    };
  }

  private compress(img: HTMLImageElement, maxSize: number, quality: number): Promise<Blob> {
    const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b as Blob), 'image/jpeg', quality));
  }

  protected formatBytes(bytes: number): string {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(2)} MB`;
  }
}
