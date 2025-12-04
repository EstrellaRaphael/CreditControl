import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComprasPageComponent } from './compras-page';

describe('ComprasPage', () => {
  let component: ComprasPageComponent;
  let fixture: ComponentFixture<ComprasPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComprasPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComprasPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
