import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartoesPage } from './cartoes-page';

describe('CartoesPage', () => {
  let component: CartoesPage;
  let fixture: ComponentFixture<CartoesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartoesPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartoesPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
