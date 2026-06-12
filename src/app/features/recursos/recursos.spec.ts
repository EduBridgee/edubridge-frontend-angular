import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecursosComponent } from './recursos';

describe('RecursosComponent', () => {
  let component: RecursosComponent;
  let fixture: ComponentFixture<RecursosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecursosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RecursosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
