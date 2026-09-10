import { TestBed } from '@angular/core/testing';

import { AuthenticatedUser } from '@core/models/user.model';

import { SessionService } from './session.service';

const user = {
  id: 7,
  name: 'Priya Nair',
  email: 'priya.nair@finoocean.test',
  role: 'telecaller',
} as unknown as AuthenticatedUser;

const TOKEN_KEY = 'finoocean.token';
const USER_KEY = 'finoocean.user';

describe('SessionService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  function make(): SessionService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(SessionService);
  }

  it('starts empty when nothing is persisted', () => {
    const session = make();
    expect(session.token).toBeNull();
    expect(session.user).toBeNull();
  });

  it('primes the synchronous cache from localStorage on construction (web path)', () => {
    localStorage.setItem(TOKEN_KEY, 'tok-abc');
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    const session = make();

    expect(session.token).toBe('tok-abc');
    expect(session.user?.email).toBe(user.email);
  });

  it('hydrate() reloads the cache from the store and is idempotent', async () => {
    const session = make();
    expect(session.token).toBeNull();

    // Written directly to the backing store, bypassing the constructor prime.
    localStorage.setItem(TOKEN_KEY, 'tok-late');

    await session.hydrate();
    expect(session.token).toBe('tok-late');

    const first = session.hydrate();
    const second = session.hydrate();
    expect(first).toBe(second);
    await first;
  });

  it('persist() updates the synchronous getters and writes through', () => {
    const session = make();

    session.persist('tok-xyz', user);

    expect(session.token).toBe('tok-xyz');
    expect(session.user?.email).toBe(user.email);
    expect(localStorage.getItem(TOKEN_KEY)).toBe('tok-xyz');
    expect(JSON.parse(localStorage.getItem(USER_KEY) ?? '{}').email).toBe(user.email);
  });

  it('clear() empties the cache and the store', () => {
    const session = make();
    session.persist('tok-xyz', user);

    session.clear();

    expect(session.token).toBeNull();
    expect(session.user).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it('drops a malformed persisted user and self-heals', () => {
    localStorage.setItem(USER_KEY, '{not json');
    const session = make();

    expect(session.user).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });
});
