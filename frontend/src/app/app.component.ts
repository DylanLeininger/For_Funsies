import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

interface Drawing {
  draw_date: string;
  white_ball_1: number;
  white_ball_2: number;
  white_ball_3: number;
  white_ball_4: number;
  white_ball_5: number;
  powerball: number;
  power_play: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, AfterViewInit {
  drawings: Drawing[] = [];
  dataSource = new MatTableDataSource<Drawing>([]);
  displayedColumns: string[] = [
    'draw_date',
    'white_ball_1',
    'white_ball_2',
    'white_ball_3',
    'white_ball_4',
    'white_ball_5',
    'powerball',
    'power_play',
  ];
  // Chart controls
  chartType: 'pie' | 'vertical' | 'horizontal' = 'pie';
  chartColumn: string = 'power_play';
  availableColumns = [
    { value: 'power_play', label: 'Power Play' },
    { value: 'powerball', label: 'Powerball' },
    { value: 'white_balls', label: 'White Balls (aggregate)' },
    { value: 'white_ball_1', label: 'White Ball 1' },
    { value: 'white_ball_2', label: 'White Ball 2' },
    { value: 'white_ball_3', label: 'White Ball 3' },
    { value: 'white_ball_4', label: 'White Ball 4' },
    { value: 'white_ball_5', label: 'White Ball 5' },
  ];
  chartData: any[] = [];
  colorScheme = {
    domain: [
      '#5AA454',
      '#A10A28',
      '#C7B42C',
      '#AAAAAA',
      '#FF8A65',
      '#4FC3F7',
      '#BA68C8',
      '#FFD54F',
      '#90A4AE',
      '#F06292',
    ],
  };
  date = '';
  minDate = '';
  maxDate = '';
  ball: number | null = null;
  powerball: number | null = null;
  powerPlay = '';
  loading = false;
  error = '';

  // Chart data
  pieData: any[] = [];
  verticalData: any[] = [];
  horizontalData: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadDrawings();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  loadDrawings() {
    this.loading = true;
    this.error = '';
    let params = new HttpParams();

    if (this.date) {
      params = params.set('date', this.date);
    }
    if (this.minDate) {
      params = params.set('minDate', this.minDate);
    }
    if (this.maxDate) {
      params = params.set('maxDate', this.maxDate);
    }
    if (this.ball !== null) {
      params = params.set('ball', this.ball.toString());
    }
    if (this.powerball !== null) {
      params = params.set('powerball', this.powerball.toString());
    }
    if (this.powerPlay) {
      params = params.set('powerPlay', this.powerPlay);
    }

    this.http
      .get<Drawing[]>(`${environment.apiUrl}/api/drawings`, { params })
      .subscribe({
        next: data => {
          this.drawings = data;
          this.dataSource.data = data;
          this.computeCharts(data);
          this.updateCharts();
          this.loading = false;
        },
        error: err => {
          console.error(err);
          this.error = 'Unable to load drawings. Check that the backend is running.';
          this.loading = false;
        },
      });
  }

  resetFilters() {
    this.date = '';
    this.minDate = '';
    this.maxDate = '';
    this.ball = null;
    this.powerball = null;
    this.powerPlay = '';
    this.loadDrawings();
  }

  private computeCharts(data: Drawing[]) {
    // Pie: distribution of Power Play values
    const powerPlayCounts: Record<string, number> = {};
    // Vertical: frequency of white balls across all draws
    const whiteCounts: Record<number, number> = {};
    // Horizontal: frequency of powerball numbers
    const powerballCounts: Record<number, number> = {};

    data.forEach(d => {
      const pp = d.power_play || 'none';
      powerPlayCounts[pp] = (powerPlayCounts[pp] || 0) + 1;

      [
        d.white_ball_1,
        d.white_ball_2,
        d.white_ball_3,
        d.white_ball_4,
        d.white_ball_5,
      ].forEach(w => {
        whiteCounts[w] = (whiteCounts[w] || 0) + 1;
      });

      powerballCounts[d.powerball] = (powerballCounts[d.powerball] || 0) + 1;
    });

    this.pieData = Object.entries(powerPlayCounts).map(([name, value]) => ({ name, value }));

    // Convert whiteCounts to sorted array for vertical chart
    this.verticalData = Object.entries(whiteCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => Number(a.name) - Number(b.name));

    this.horizontalData = Object.entries(powerballCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => Number(a.name) - Number(b.name));
  }

  private buildCountsForColumn(data: Drawing[], column: string): Record<string, number> {
    const counts: Record<string, number> = {};
    data.forEach(d => {
      if (column === 'white_balls') {
        [
          d.white_ball_1,
          d.white_ball_2,
          d.white_ball_3,
          d.white_ball_4,
          d.white_ball_5,
        ].forEach(v => {
          const key = String(v);
          counts[key] = (counts[key] || 0) + 1;
        });
      } else {
        const value = (d as any)[column];
        const key = value === null || value === undefined ? 'none' : String(value);
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }

  updateCharts() {
    const counts = this.buildCountsForColumn(this.drawings, this.chartColumn);
    const items = Object.entries(counts).map(([name, value]) => ({ name, value }));
    // sort numerically when keys are numbers
    const numericSorted = items.sort((a, b) => {
      const an = Number(a.name);
      const bn = Number(b.name);
      if (!isNaN(an) && !isNaN(bn)) return an - bn;
      return b.value - a.value;
    });
    this.chartData = numericSorted;
  }

  get legendItems() {
    const total = this.chartData.reduce((s, it) => s + Number(it.value || 0), 0) || 1;
    return this.chartData.map((it: any, idx: number) => ({
      name: it.name,
      value: Number(it.value || 0),
      percent: Math.round(((Number(it.value || 0) / total) * 100) * 10) / 10,
      color: this.colorScheme.domain[idx % this.colorScheme.domain.length],
    }));
  }

  onChartTypeChange() {
    this.updateCharts();
  }

  onChartColumnChange() {
    this.updateCharts();
  }

  get chartTitle(): string {
    const found = this.availableColumns.find(c => c.value === this.chartColumn);
    return found ? found.label : 'Chart';
  }
}
