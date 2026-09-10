import { TestBed } from '@angular/core/testing';

import { DeviceService } from './device.service';
import { DownloadService } from './download.service';

describe('DownloadService (web path)', () => {
  it('triggers an anchor download without throwing', async () => {
    const service = TestBed.inject(DownloadService);
    const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click');

    await service.save(new Blob(['hello'], { type: 'text/plain' }), 'note.txt');

    expect(clickSpy).toHaveBeenCalled();
  });
});

describe('DeviceService (web fallbacks)', () => {
  it('takePhoto() returns null so the caller uses its <input type="file">', async () => {
    const service = TestBed.inject(DeviceService);
    await expectAsync(service.takePhoto()).toBeResolvedTo(null);
  });

  it('reports no native camera on the web', () => {
    expect(TestBed.inject(DeviceService).hasNativeCamera).toBe(false);
  });
});
