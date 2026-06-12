import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestionDocenteComponent } from './gestion-docente';

describe('GestionDocenteComponent', () => {
  let component: GestionDocenteComponent;
  let fixture: ComponentFixture<GestionDocenteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionDocenteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionDocenteComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
