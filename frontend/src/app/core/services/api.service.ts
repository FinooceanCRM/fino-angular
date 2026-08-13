import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '@env/environment';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  meta?: Record<string, unknown>;
}

/**
 * Thin transport wrapper around HttpClient. Feature services depend on this
 * and never call HttpClient directly.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  get<T>(path: string, params?: Record<string, string | number>): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(this.url(path), { params: this.toParams(params) })
      .pipe(map((response) => response.data));
  }

  /** GET returning the full envelope, for endpoints that carry pagination meta. */
  getEnvelope<T>(
    path: string,
    params?: Record<string, string | number>,
  ): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(this.url(path), {
      params: this.toParams(params),
    });
  }

  /** Multipart upload (documents). */
  upload<T>(path: string, form: FormData): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(this.url(path), form)
      .pipe(map((response) => response.data));
  }

  download(path: string): Observable<Blob> {
    return this.http.get(this.url(path), { responseType: 'blob' });
  }

  post<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(this.url(path), body)
      .pipe(map((response) => response.data));
  }

  put<T>(path: string, body: unknown = {}): Observable<T> {
    return this.http
      .put<ApiResponse<T>>(this.url(path), body)
      .pipe(map((response) => response.data));
  }

  delete<T>(path: string): Observable<T> {
    return this.http
      .delete<ApiResponse<T>>(this.url(path))
      .pipe(map((response) => response.data));
  }

  private url(path: string): string {
    return `${this.baseUrl}/${path.replace(/^\//, '')}`;
  }

  private toParams(params?: Record<string, string | number>): HttpParams {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value === '' || value === null || value === undefined) {
        continue;
      }
      httpParams = httpParams.set(key, String(value));
    }
    return httpParams;
  }
}
