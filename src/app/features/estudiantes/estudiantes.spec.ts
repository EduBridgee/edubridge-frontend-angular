import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstudiantesComponent  } from './estudiantes';

describe('Estudiantes', () => {
  let component: EstudiantesComponent ;
  let fixture: ComponentFixture<EstudiantesComponent >;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstudiantesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EstudiantesComponent );
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
