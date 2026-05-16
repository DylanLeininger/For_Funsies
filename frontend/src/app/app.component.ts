import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';

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
export class AppComponent implements OnInit {
  drawings: Drawing[] = [];
  date = '';
  minDate = '';
  maxDate = '';
  ball: number | null = null;
  powerball: number | null = null;
  powerPlay = '';
  loading = false;
  error = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadDrawings();
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
}
