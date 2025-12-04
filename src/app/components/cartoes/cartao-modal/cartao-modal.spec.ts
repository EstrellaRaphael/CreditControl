import { ComponentFixture, TestBed } from '@angular/core/testing';

import {  CartaoModalComponent } from './cartao-modal';

describe('CartaoModal', () => {
  let component: CartaoModalComponent;
  let fixture: ComponentFixture<CartaoModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartaoModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartaoModalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
