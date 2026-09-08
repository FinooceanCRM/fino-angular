import { AsyncPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, RouterLink } from '@angular/router';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

import { CertImage, VendorCertification } from '@core/models/vendor-certification.model';
import { VendorCertificationService } from '@core/services/vendor-certification.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { AuthImagePipe } from '@shared/pipes/auth-image.pipe';

/**
 * Government-style Vendor Certificate + client-side PDF export — the Fino
 * port of `pages/certificate.php` + `assets/js/certificate.js`. Reuses the
 * same html2canvas + jsPDF single-A4-page approach; the QR encodes this
 * page's URL and the verification code comes from the server.
 */
@Component({
  selector: 'app-vendor-certificate',
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    PageHeaderComponent,
    AuthImagePipe,
  ],
  templateUrl: './vendor-certificate.component.html',
  styleUrl: './vendor-certificate.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorCertificateComponent implements OnInit, AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly certs = inject(VendorCertificationService);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild('certificate') private certificateEl?: ElementRef<HTMLElement>;
  @ViewChild('qr') private qrEl?: ElementRef<HTMLCanvasElement>;

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly generating = signal(false);
  protected readonly cert = signal<VendorCertification | null>(null);

  private autoDownload = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.autoDownload = this.route.snapshot.queryParamMap.get('download') === '1';

    this.certs.certificate(id).subscribe({
      next: (res) => {
        this.cert.set(res.certification);
        this.loading.set(false);
        // The <canvas #qr> only exists once `cert()` has re-rendered the
        // view, so paint it on the next frame (and retry once for safety).
        setTimeout(() => this.renderQr(), 120);
        setTimeout(() => this.renderQr(), 500);
        if (this.autoDownload) setTimeout(() => this.downloadPdf(), 1600);
      },
      error: (err: { message?: string }) => {
        this.error.set(err?.message ?? 'Could not load the certificate.');
        this.loading.set(false);
      },
    });
  }

  ngAfterViewInit(): void {
    this.renderQr();
  }

  protected photo(type: CertImage['image_type']): string | null {
    return this.cert()?.images.find((i) => i.image_type === type)?.path ?? null;
  }

  protected products(): CertImage[] {
    return this.cert()?.images.filter((i) => i.image_type === 'product') ?? [];
  }

  protected composedAddress(): string {
    const c = this.cert();
    if (!c) return '—';
    return (
      [c.address, c.landmark, c.city, c.district, c.state, c.pin_code]
        .filter((v) => v && String(v).trim() !== '')
        .join(', ') || '—'
    );
  }

  protected maskAadhaar(value: string | null): string {
    const digits = (value ?? '').replace(/\D/g, '');
    return digits.length === 12 ? `XXXX XXXX ${digits.slice(-4)}` : value || '—';
  }

  private renderQr(): void {
    if (!this.qrEl) return;
    void QRCode.toCanvas(this.qrEl.nativeElement, window.location.href.split('?')[0], {
      width: 120,
      margin: 1,
    });
  }

  protected async downloadPdf(): Promise<void> {
    const node = this.certificateEl?.nativeElement;
    const c = this.cert();
    if (!node || !c) return;

    this.generating.set(true);
    try {
      // Every certificate photo is an async blob URL — let the pipes emit,
      // then make sure they've all decoded before html2canvas snapshots, or
      // the PDF gets blank frames.
      await new Promise((r) => setTimeout(r, 350));
      await this.waitForImages(node);

      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 18;
      const ratio = Math.min(
        (pageWidth - margin * 2) / canvas.width,
        (pageHeight - margin * 2) / canvas.height,
      );
      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      const offsetX = (pageWidth - imgWidth) / 2;

      pdf.addImage(canvas.toDataURL('image/jpeg', 0.94), 'JPEG', offsetX, margin, imgWidth, imgHeight);
      pdf.save(`Vendor-Certification-${c.certificate_number}.pdf`);
      this.snackBar.open('Certificate PDF downloaded.', 'Dismiss', { duration: 4000 });
    } catch {
      this.snackBar.open('PDF generation failed. Use your browser Print instead.', 'Dismiss', {
        duration: 5000,
      });
      window.print();
    } finally {
      this.generating.set(false);
    }
  }

  private waitForImages(node: HTMLElement): Promise<unknown> {
    const imgs = Array.from(node.querySelectorAll('img'));
    return Promise.all(
      imgs.map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.addEventListener('load', () => resolve(), { once: true });
              img.addEventListener('error', () => resolve(), { once: true });
              setTimeout(resolve, 5000);
            }),
      ),
    );
  }

  protected print(): void {
    window.print();
  }

  protected copyLink(): void {
    const url = window.location.href.split('?')[0];
    void navigator.clipboard?.writeText(url).then(() =>
      this.snackBar.open('Certificate link copied.', 'Dismiss', { duration: 3000 }),
    );
  }
}
