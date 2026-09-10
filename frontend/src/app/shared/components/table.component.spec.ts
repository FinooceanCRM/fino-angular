import { BreakpointObserver } from '@angular/cdk/layout';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { TableColumn, TableComponent } from './table.component';

interface Row {
  name: string;
  city: string;
}

const columns: TableColumn<Row>[] = [
  { key: 'name', label: 'Name' },
  { key: 'city', label: 'City' },
];

const rows: Row[] = [
  { name: 'Anil', city: 'Pune' },
  { name: 'Meera', city: 'Mumbai' },
];

describe('TableComponent', () => {
  let fixture: ComponentFixture<TableComponent<Row>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TableComponent],
      providers: [
        // Deterministic "wide" viewport regardless of the Karma window size.
        {
          provide: BreakpointObserver,
          useValue: { observe: () => of({ matches: false, breakpoints: {} }) },
        },
      ],
    });

    fixture = TestBed.createComponent(TableComponent<Row>);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', rows);
  });

  it('renders a <table> on a wide viewport', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('table.app-table')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.app-table-cards')).toBeNull();
  });

  it('renders one labelled card per row when stacked', () => {
    fixture.componentRef.setInput('forceStacked', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('table.app-table')).toBeNull();

    const cards = fixture.nativeElement.querySelectorAll('.app-table-card');
    expect(cards.length).toBe(rows.length);
    expect(cards[0].textContent).toContain('Name');
    expect(cards[0].textContent).toContain('Anil');
    expect(cards[0].textContent).toContain('City');
    expect(cards[0].textContent).toContain('Pune');
  });

  it('keeps the pagination bar in stacked mode', () => {
    fixture.componentRef.setInput('forceStacked', true);
    fixture.componentRef.setInput('length', 40);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-pagination')).toBeTruthy();
  });
});
