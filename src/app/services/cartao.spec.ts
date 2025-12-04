import { TestBed } from '@angular/core/testing';

import { CartaoService } from './cartao';

describe('Cartao', () => {
  let service: CartaoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartaoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
