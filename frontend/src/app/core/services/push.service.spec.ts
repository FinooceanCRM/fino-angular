import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { PushService } from './push.service';

describe('PushService (web)', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('register() is a no-op on the web (does not touch the plugin or the API)', async () => {
    await expectAsync(TestBed.inject(PushService).register()).toBeResolved();
  });

  it('unregister() is a no-op on the web', async () => {
    await expectAsync(TestBed.inject(PushService).unregister()).toBeResolved();
  });
});
