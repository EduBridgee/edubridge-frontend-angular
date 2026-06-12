import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TutoriasComponent } from './tutorias';

describe('TutoriasComponent', () => {
  let component: TutoriasComponent;
  let fixture: ComponentFixture<TutoriasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TutoriasComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TutoriasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
