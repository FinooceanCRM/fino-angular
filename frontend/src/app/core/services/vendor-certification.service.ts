import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  CertImage,
  CertImageType,
  VendorCertification,
  VendorCertificationDraftPayload,
  VendorCertificationMetadata,
} from '@core/models/vendor-certification.model';

import { ApiService } from './api.service';

/**
 * Transport for the Vendor Certification wizard. Mirrors the reference
 * app's survey/submit/upload/draft endpoints; ownership is always enforced
 * server-side, so no vendor id is ever sent.
 */
@Injectable({ providedIn: 'root' })
export class VendorCertificationService {
  private readonly api = inject(ApiService);

  metadata(): Observable<VendorCertificationMetadata> {
    return this.api.get<VendorCertificationMetadata>('vendors/certifications/metadata');
  }

  list(): Observable<VendorCertification[]> {
    return this.api.get<VendorCertification[]>('vendors/certifications');
  }

  get(id: number): Observable<VendorCertification> {
    return this.api.get<VendorCertification>(`vendors/certifications/${id}`);
  }

  /** The single open draft (created server-side on first read). */
  draft(): Observable<VendorCertification> {
    return this.api.get<VendorCertification>('vendors/certifications/draft');
  }

  saveDraft(payload: VendorCertificationDraftPayload): Observable<VendorCertification> {
    return this.api.put<VendorCertification>('vendors/certifications/draft', payload);
  }

  uploadImage(type: CertImageType, file: Blob, filename: string): Observable<CertImage> {
    const form = new FormData();
    form.append('type', type);
    form.append('image', file, filename);
    return this.api.upload<CertImage>('vendors/certifications/images', form);
  }

  deleteImage(imageId: number): Observable<null> {
    return this.api.delete<null>(`vendors/certifications/images/${imageId}`);
  }

  submit(payload: VendorCertificationDraftPayload): Observable<VendorCertification> {
    return this.api.post<VendorCertification>('vendors/certifications', payload);
  }

  certificate(
    id: number,
  ): Observable<{ certification: VendorCertification; certificate: VendorCertification['certificate'] }> {
    return this.api
      .get<{ certification: VendorCertification; certificate: VendorCertification['certificate'] }>(
        `vendors/certifications/${id}/certificate`,
      )
      .pipe(map((res) => res));
  }
}
