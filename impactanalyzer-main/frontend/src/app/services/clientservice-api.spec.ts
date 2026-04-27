import { TestBed } from '@angular/core/testing';

import { ClientserviceApi } from './clientservice-api';

describe('ClientserviceApi', () => {
  let service: ClientserviceApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientserviceApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
